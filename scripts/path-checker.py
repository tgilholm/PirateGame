# Used to generate a visualisation of paths for npcs

import sys
import json
import matplotlib.pyplot as plt

data = json.load(sys.stdin) # from node
x = data['x']
y = data['y']

plt.figure(figsize=(8, 5))
plt.plot(x, y, marker='o', linestyle='None', markersize=5)
plt.title(data.get('title', 'Path'))
plt.xlabel(data.get('xlabel', 'X'))
plt.ylabel(data.get('ylabel', 'Y'))
plt.grid(True)
plt.tight_layout()

output_path = data.get('output', 'plot.png')
plt.savefig(output_path)
print(f"Saved path to: ./{output_path}")