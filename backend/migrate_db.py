
import sqlite3

def migrate():
    # Connect to the database
    conn = sqlite3.connect('applications.db')
    cursor = conn.cursor()

    try:
        # Check if columns usually exist
        print("Checking columns...")
        
        # Add initial_score column
        try:
            cursor.execute("ALTER TABLE savedresume ADD COLUMN initial_score INTEGER DEFAULT 0")
            print("Added initial_score column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("initial_score column already exists.")
            else:
                print(f"Error adding initial_score: {e}")

        # Add projected_score column
        try:
            cursor.execute("ALTER TABLE savedresume ADD COLUMN projected_score INTEGER DEFAULT 0")
            print("Added projected_score column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("projected_score column already exists.")
            else:
                print(f"Error adding projected_score: {e}")

        conn.commit()
        print("Migration complete.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
