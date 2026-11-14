//! Browser DTOs and strict JavaScript validation; mathematics remains in crypto-core.
#![forbid(unsafe_code)]
mod dto;
mod request;
use serde::Serialize;
use wasm_bindgen::prelude::*;

fn serialize<T: Serialize>(value: &Result<T, dto::ApiError>) -> JsValue {
    #[derive(Serialize)]
    #[serde(untagged)]
    enum Reply<'a, T> {
        Success { ok: bool, value: &'a T },
        Failure { ok: bool, error: &'a dto::ApiError },
    }
    let reply = match value {
        Ok(value) => Reply::Success { ok: true, value },
        Err(error) => Reply::Failure { ok: false, error },
    };
    // json_compatible retains safe-integer checking for i64; never enable BigInt.
    reply
        .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
        .unwrap_or_else(|_| {
            let error = Reply::<()>::Failure {
                ok: false,
                error: &dto::ApiError::InternalError,
            };
            error
                .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
                .unwrap_or(JsValue::NULL)
        })
}

/// Execute a validated cipher request without coercing JavaScript input.
#[wasm_bindgen(js_name = executeCipher)]
pub fn execute_cipher(request: JsValue) -> JsValue {
    serialize(&request::cipher(request).and_then(dto::execute))
}

/// Normalize each present i32 independently; null stays null.
#[wasm_bindgen(js_name = normalizeAffineKey)]
pub fn normalize_affine_key(request: JsValue) -> JsValue {
    serialize(&request::partial_key(request).and_then(dto::normalize))
}
