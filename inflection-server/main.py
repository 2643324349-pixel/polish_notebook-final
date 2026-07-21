"""FastAPI bridge for Morfeusz inflection analysis."""

from pathlib import Path

from dotenv import load_dotenv

# Load env before any module reads os.getenv at import time.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from account_service import AccountDeletionError, delete_user_account
from ai_fallback import AiFallbackUnavailable, ai_inflect, ai_translate
from morfeusz_service import (
    WordNotFoundError,
    analyze_word,
    generate_forms_with_ai_fallback,
)

app = FastAPI(title="Polish Inflection API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    word: str = Field(..., min_length=1, max_length=200)
    lang: str = Field(default="en", max_length=20)
    selected_candidate_id: str | None = None


class AnalyzeCandidateResponse(BaseModel):
    id: str
    morf_lemma: str
    lemma: str
    pos: str
    tag: str
    label: str
    translations: list[str]


class AnalyzeResponse(BaseModel):
    lemma: str
    morf_lemma: str
    pos: str
    grammemes: dict
    inflection: dict
    has_gender: bool
    translations: list[str]
    confidence: str
    ambiguity_level: str = "none"
    needs_user_choice: bool = False
    candidates: list[AnalyzeCandidateResponse] = Field(default_factory=list)


class GenerateRequest(BaseModel):
    morf_lemma: str
    pos: str
    has_gender: bool
    case_types: list[str] = Field(..., min_length=1)
    lang: str = Field(default="en", max_length=20)


class GenerateResponse(BaseModel):
    forms: dict[str, dict[str, str]]
    ai_generated_cases: list[str] = Field(default_factory=list)


class AiTranslateRequest(BaseModel):
    word: str = Field(..., min_length=1, max_length=200)
    pos: str = Field(..., min_length=1, max_length=50)
    lang: str = Field(default="en", max_length=20)
    target_lang: str | None = Field(default=None, max_length=20)

    @model_validator(mode="before")
    @classmethod
    def normalize_lang(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        target = data.get("target_lang")
        if target and not data.get("lang"):
            data["lang"] = target
        elif target:
            data["lang"] = target
        return data


class AiTranslateResponse(BaseModel):
    translation: str
    is_ai_generated: bool = True


class AiInflectRequest(BaseModel):
    word: str = Field(..., min_length=1, max_length=200)
    pos: str = Field(..., min_length=1, max_length=50)
    case_types: list[str] = Field(..., min_length=1)
    has_gender: bool = False


class AiInflectResponse(BaseModel):
    forms: dict[str, dict[str, str]]


class DeleteAccountRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)


class DeleteAccountResponse(BaseModel):
    success: bool = True


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/inflect/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    try:
        result = analyze_word(
            request.word,
            lang=request.lang,
            selected_candidate_id=request.selected_candidate_id,
        )
        return AnalyzeResponse(**result)
    except WordNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/inflect/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest) -> GenerateResponse:
    forms, ai_generated_cases = await generate_forms_with_ai_fallback(
        request.morf_lemma,
        request.pos,
        request.has_gender,
        request.case_types,
        lang=request.lang,
    )
    return GenerateResponse(forms=forms, ai_generated_cases=ai_generated_cases)


@app.post("/api/inflect/ai-translate", response_model=AiTranslateResponse)
async def translate_ai(request: AiTranslateRequest) -> AiTranslateResponse:
    try:
        translation = await ai_translate(request.word, request.pos, request.lang)
    except AiFallbackUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not translation:
        raise HTTPException(status_code=404, detail="translation not available")

    return AiTranslateResponse(translation=translation)


@app.post("/api/inflect/ai-inflect", response_model=AiInflectResponse)
async def inflect_ai(request: AiInflectRequest) -> AiInflectResponse:
    try:
        forms = await ai_inflect(
            request.word,
            request.pos,
            request.case_types,
            request.has_gender,
        )
    except AiFallbackUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not forms:
        raise HTTPException(status_code=404, detail="inflection not available")

    return AiInflectResponse(forms=forms)


@app.post("/api/delete-account", response_model=DeleteAccountResponse)
async def delete_account(
    request: DeleteAccountRequest,
    authorization: str | None = Header(default=None),
) -> DeleteAccountResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    access_token = authorization.removeprefix("Bearer ").strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing access token")

    try:
        await delete_user_account(request.user_id, access_token)
    except AccountDeletionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return DeleteAccountResponse()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
