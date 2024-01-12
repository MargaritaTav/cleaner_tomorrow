# test_script.py

import sys

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a name as a command-line argument.")
    else:
        name = sys.argv[1]
        print(f"Hello, {name}!")
