"""Converts natural language to SQL and runs queries against the student database.
   Includes SQL safety checks: only read-only SELECT queries are allowed."""
from database import run_query
from zotgpt_client import client

# Keywords that indicate destructive or write operations - block these
DANGEROUS_KEYWORDS = [
    "delete", "drop", "truncate", "update", "insert", "alter",
    "create", "grant", "revoke", "execute", "copy", "vacuum",
    "reindex", "cluster", "lock", "unlisten", "notify",
    "; --", "/*", "*/", "pg_sleep", "pg_read_file", "lo_import",
]


def is_safe_sql(sql: str) -> bool:
    """Validate that the SQL is a read-only SELECT statement.
    Returns False if the query could modify data or schema."""
    if not sql or not isinstance(sql, str):
        return False
    sql_stripped = sql.strip()
    if not sql_stripped:
        return False
    sql_upper = sql_stripped.upper()
    sql_lower = sql_stripped.lower()
    # Must start with SELECT (allow WITH for CTEs)
    if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
        return False
    # Block dangerous keywords anywhere in the query
    for kw in DANGEROUS_KEYWORDS:
        if kw in sql_lower:
            return False
    return True


# Schema context for the LLM - update based on your actual tables
SCHEMA_CONTEXT = """
You are a SQL expert for a PostgreSQL student learning analytics database (schema: public).

Your task: generate ONE read-only SQL SELECT query to answer a user's question about students, courses, engagement, or performance.

Return ONLY the SQL query.
Do NOT include explanations, comments, or markdown.

Allowed:
SELECT queries only.

Forbidden:
DELETE, UPDATE, INSERT, DROP, TRUNCATE, ALTER, CREATE.

If the question cannot be answered using the schema, return exactly:
-- NO_QUERY


DATABASE OVERVIEW
This database stores LMS (Learning Management System) analytics including:
- students and instructors
- course enrollments
- assignments
- learning activity metrics
- survey responses
- engagement data (pageviews)
- workflow learning steps
- wellness check-ins


KEY TABLES

users
Stores system users (students/instructors).
Columns:
- id (integer, primary key)
- name (varchar)
- email (varchar)
- lms_user_id (bigint)
- lms_global_user_id (varchar)
- test_student (boolean)

courses
Course metadata.
Columns:
- id (integer)
- name (varchar)
- description (varchar)
- lms_course_id (integer)
- account_id (integer)
- start_date (timestamp)
- end_date (timestamp)
- course_length (smallint)
- course_session (varchar)

course_users
Enrollment table linking users and courses.
Columns:
- user_id (integer)
- course_id (integer)
- active (boolean)
- final_grade (varchar)
- final_score (real)
- current_grade (varchar)
- current_score (real)

roles
Role definitions (student, instructor, etc).
Columns:
- id (integer)
- name (varchar)
- lms_name (varchar)

user_roles
Mapping between users, courses, and roles.
Columns:
- user_id (integer)
- role_id (integer)
- course_id (integer)


ASSIGNMENTS

assignments
Course assignments.
Columns:
- id (integer)
- course_id (integer)
- name (varchar)
- weight (double precision)
- points (numeric)
- duedate (timestamp)
- submission_type (varchar)
- expected_time (interval)


ENGAGEMENT / ACTIVITY DATA

pageviews
Tracks student engagement per day.
Columns:
- id (integer)
- user_id (integer)
- course_id (integer)
- capture_date (date)
- pageview_count (bigint)
- participation_count (bigint)


PERFORMANCE / ANALYTICS

user_statistics
Detailed user activity and learning metrics.
Columns:
- id
- user_id
- course_id
- period_id
- workflow_paradigm_id
- lv (boolean)
- lq (numeric)
- alv (boolean)
- alq (numeric)
- completed (boolean)
- lq_score (numeric)
- start_time (timestamp)
- completed_date_time (timestamp)

course_statistics
Aggregated course metrics.
Columns:
- id
- course_id
- lms_content_id
- lv
- lq
- alv
- alq
- completed


SURVEY / WELLNESS DATA

som_questions
Survey questions.
Columns:
- id
- en (varchar)
- es (varchar)
- motivation
- verb
- position
- qtype
- required

som_responses
Survey submission records.
Columns:
- id
- user_id
- course_id
- submitted (timestamp)
- wellness (integer)
- completed (boolean)
- survey_id

som_question_responses
Answers to survey questions.
Columns:
- question_id
- response_id
- answer (integer)
- verbose_answer (varchar)


LEARNING WORKFLOW DATA

workflow_paradigms
Learning workflow templates.

step_groups
Groups of learning steps.

steps
Individual learning steps.

user_step_groups
Tracks user progress through step groups.
Columns:
- user_id
- course_id
- step_group_id
- completed (boolean)

user_next_step_groups
Recommended next step groups for a user.


WELLNESS CHECKINS

wellness_checkin_schedule
Scheduled wellness check-ins.
Columns:
- course_id
- start_date_time
- end_date_time
- survey_id


COMMON JOIN RELATIONSHIPS

User enrollment:
course_users.user_id → users.id
course_users.course_id → courses.id

Roles:
user_roles.user_id → users.id
user_roles.role_id → roles.id
user_roles.course_id → courses.id

Assignments:
assignments.course_id → courses.id

Analytics:
user_statistics.user_id → users.id
user_statistics.course_id → courses.id

Engagement:
pageviews.user_id → users.id
pageviews.course_id → courses.id

Surveys:
som_responses.user_id → users.id
som_responses.course_id → courses.id
som_question_responses.response_id → som_responses.id


QUERY GUIDELINES

- Use JOINs instead of subqueries when possible.
- Use GROUP BY for aggregations.
- Always include LIMIT 50 unless the question explicitly asks for totals.
- Use ORDER BY for rankings (highest engagement, grades, etc.).
- Use COUNT(), AVG(), SUM() for analytics queries.

Example: Top courses by enrollment

SELECT
    c.name,
    COUNT(cu.user_id) AS student_count
FROM course_users cu
JOIN courses c ON cu.course_id = c.id
GROUP BY c.id, c.name
ORDER BY student_count DESC
LIMIT 15;

"""

def generate_sql(user_question: str) -> str:
    """Use the LLM to convert natural language to SQL."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SCHEMA_CONTEXT},
                {"role": "user", "content": user_question},
            ],
            temperature=0.2,
        )
        sql = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if sql.startswith("```"):
            lines = sql.split("\n")
            sql = "\n".join(lines[1:-1]) if len(lines) > 2 else sql
        return sql
    except Exception as e:
        print("SQL generation error:", e)
        return ""


def query_for_context(user_question: str) -> str:
    """Generate SQL from question, validate it is safe, run it, return results as context string."""
    sql = generate_sql(user_question)
    if not sql or sql.startswith("-- NO_QUERY"):
        return ""
    if not is_safe_sql(sql):
        print("Rejected unsafe SQL:", sql[:200])
        return ""
    try:
        result = run_query(sql)
        return result if result else ""
    except Exception as e:
        print("Query execution error:", e)
        return ""