import json
import csv

def json_to_csv(json_file_path, csv_file_path):
    """
    Convert JSON file with players data to CSV format
    """
    try:
        # Read the JSON file
        with open(json_file_path, 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
        
        # Extract the players list
        players = data['players']
        
        # Get all possible field names from all players (in case some have different fields)
        all_fields = set()
        for player in players:
            all_fields.update(player.keys())
        
        # Sort fields for consistent column order
        fieldnames = sorted(list(all_fields))
        
        # Write to CSV
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            
            # Write header
            writer.writeheader()
            
            # Write player data
            for player in players:
                writer.writerow(player)
        
        print(f"Successfully converted {len(players)} players to CSV!")
        print(f"Output file: {csv_file_path}")
        
    except FileNotFoundError:
        print(f"Error: Could not find the file {json_file_path}")
    except json.JSONDecodeError:
        print("Error: Invalid JSON format")
    except Exception as e:
        print(f"Error: {str(e)}")

# Usage
if __name__ == "__main__":
    # Change these file paths as needed
    input_json = "players.json"  # Your input JSON file
    output_csv = "players.csv"   # Output CSV file
    
    json_to_csv(input_json, output_csv)
