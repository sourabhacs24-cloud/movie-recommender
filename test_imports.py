try:
    from flask import Flask
    from flask_cors import CORS
    print("Imports successful")
except ImportError as e:
    print(f"Import failed: {e}")
