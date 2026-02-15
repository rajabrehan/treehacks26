"""
Modal GPU service for OpenLobby.

This is the LLM worker the API calls for:
- question answering (RAG over retrieved docs)
- entity extraction (optional)

Deploy:
  pip install modal
  modal setup
  modal deploy modal/modal_app.py
"""

from __future__ import annotations

import modal

app = modal.App("openlobby-llm")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "vllm==0.6.3",
        "torch",
        "transformers",
        "accelerate",
    )
)

# NVIDIA-friendly defaults; swap model IDs freely.
MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.3"


@app.cls(
    image=image,
    gpu="A10G",
    container_idle_timeout=300,
    allow_concurrent_inputs=10,
)
class LLMService:
    @modal.enter()
    def load_model(self):
        from vllm import LLM, SamplingParams

        self.llm = LLM(model=MODEL_ID, max_model_len=8192)
        self.params = SamplingParams(temperature=0.2, top_p=0.9, max_tokens=900)

    @modal.method()
    def answer_question(self, question: str, context: str) -> str:
        prompt = f"""
<system>
You are OpenLobby, a nonpartisan political finance analysis assistant.
Answer using ONLY the provided context documents. If the context is insufficient,
say so explicitly and list what would be needed.
</system>

<context>
{context}
</context>

<question>
{question}
</question>

Return a concise answer with 3-7 bullets. When you cite, include the URL inline.
""".strip()

        out = self.llm.generate([prompt], self.params)[0].outputs[0].text
        return out.strip()

    @modal.method()
    def extract_entities(self, raw_text: str) -> dict:
        prompt = f"""
Return ONLY JSON.
Extract entities and relationships from the text.
Schema:
{{
  "entities":[{{"type":"politician|company|pac|lobbyist|bill","name":"string"}}],
  "relationships":[{{"type":"donation|lobbying|vote|employment","source":"string","target":"string","amount":null,"date":null,"description":"string","confidence":"high|medium|low"}}]
}}

TEXT:
{raw_text}
""".strip()

        out = self.llm.generate([prompt], self.params)[0].outputs[0].text.strip()
        # Fail-closed parsing is handled in the API layer when/if this is used.
        return {"raw": out}

