import sys
import time

print("start", flush=True)
t0 = time.time()
print("importing...", flush=True)
from backend.ingestion.chunk_recursive import chunk_recursive
print(f"imported in {time.time()-t0:.1f}s", flush=True)

text = "Hello world. This is a test document about AI.\n\nIt has multiple paragraphs.\n\nMachine learning is great." * 5
print(f"text length: {len(text)}", flush=True)

t0 = time.time()
chunks = chunk_recursive(text)
print(f"chunked in {time.time()-t0:.1f}s: {len(chunks)} chunks", flush=True)
