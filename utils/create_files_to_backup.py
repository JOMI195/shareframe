import os
import json


def generate_file_list(folder_path):
    """
    Recursively generates a list of all files in the given folder.

    Args:
        folder_path (str): Path to the folder to scan

    Returns:
        list: List of relative file paths
    """
    file_list = []

    # Get the absolute path of the folder
    abs_folder_path = os.path.abspath(folder_path)
    folder_name = os.path.basename(abs_folder_path)

    # Walk through the directory
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            # Get the full path of the file
            full_path = os.path.join(root, file)

            # Convert to relative path from the given folder
            rel_path = os.path.relpath(full_path, os.path.dirname(abs_folder_path))

            # Add the file to the list
            file_list.append(rel_path)

    # Sort the file list for better readability
    file_list.sort()

    return file_list


def save_to_json(file_list, output_file="file_list.json"):
    """
    Saves the file list to a JSON file.

    Args:
        file_list (list): List of file paths
        output_file (str): Path to save the JSON file
    """
    with open(output_file, "w") as f:
        json.dump(file_list, f, indent=4)

    print(f"File list saved to {output_file}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate a list of files recursively in a folder"
    )
    parser.add_argument("folder", help="Folder to scan")
    parser.add_argument(
        "-o",
        "--output",
        default="file_list.json",
        help="Output JSON file (default: file_list.json)",
    )

    args = parser.parse_args()

    # Generate the file list
    file_list = generate_file_list(args.folder)

    # Save to JSON
    save_to_json(file_list, args.output)

    # Print the list to console
    print(json.dumps(file_list, indent=4))
