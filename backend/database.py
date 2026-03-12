import subprocess

DB_URL = "postgresql://postgres:u7Kj9hQR-KwL@capstone-mlc-cluster.cluster-czssu24uezzz.us-west-1.rds.amazonaws.com:5432/slddash"


def run_query(query):
    try:
        result = subprocess.run(
            ["psql", DB_URL, "-c", query],
            capture_output=True,
            text=True
        )
        return result.stdout
    except Exception as e:
        return str(e)


if __name__ == "__main__":
    output = run_query("SELECT * FROM users LIMIT 5;")
    print(output)