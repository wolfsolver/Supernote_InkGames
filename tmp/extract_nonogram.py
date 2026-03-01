import re
import json

with open("c:/Users/EmmanuelePrudenzano/Downloads/SuperNote/Supernote_InkGames/module/Nonogram/nonogram.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find all eval() calls
evals = re.findall(r'eval\("(.+?)"\)', content)

for i, ev in enumerate(evals):
    # Unescape the string (it was double escaped because it was inside a string in nonogram.js, 
    # then inside eval, then regexp-found it as a string)
    # Actually, it's a JS string literal.
    
    # We can use json.loads to unescape the JS string literal if we wrap it in quotes.
    try:
        unescaped = json.loads('"' + ev + '"')
        # Clean up sourceURL if present
        unescaped = re.sub(r'//# sourceURL=.*', '', unescaped)
        
        # Get the filename from the eval string if possible (sourceURL comment)
        filename_match = re.search(r'sourceURL=webpack://Nonogram/(.+?)\?', ev)
        filename = filename_match.group(1) if filename_match else f"module_{i}.js"
        
        print(f"--- {filename} ---")
        print(unescaped)
        print("\n")
    except Exception as e:
        print(f"Error unescaping {i}: {e}")
