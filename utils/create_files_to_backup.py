import os
import json


def generate_file_list(folder_path):
    """
    Recursively generates a list of all files in the given folder.
    Uses forward slashes (/) in paths and excludes the parent folder name.

    Args:
        folder_path (str): Path to the folder to scan

    Returns:
        list: List of relative file paths with forward slashes
    """
    file_list = []

    # Get the absolute path of the folder
    abs_folder_path = os.path.abspath(folder_path)

    # Walk through the directory
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            # Get the full path of the file
            full_path = os.path.join(root, file)

            # Create relative path from inside the folder (excluding parent folder name)
            rel_path = os.path.relpath(full_path, abs_folder_path)

            # Convert backslashes to forward slashes
            rel_path = rel_path.replace("\\", "/")

            # Add the file to the list
            file_list.append(rel_path)

    # Sort the file list for better readability
    file_list.sort()

    return file_list


def save_to_json(file_list):
    """
    Saves the file list to a JSON file.

    Args:
        file_list (list): List of file paths
        output_file (str): Path to save the JSON file
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, "files_to_backup.json")
    with open(output_file, "w") as f:
        json.dump(file_list, f, indent=4)

    print(f"File list saved to {output_file}")


if __name__ == "__main__":
    # Ask for folder path after script starts
    folder_path = input("Enter the folder path to scan: ")

    # Generate the file list
    file_list = generate_file_list(folder_path)

    # Save to JSON
    save_to_json(file_list)
