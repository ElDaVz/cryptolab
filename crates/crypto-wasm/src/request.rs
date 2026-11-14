use crate::dto::{ApiError, Key, PartialKey, Request};
use crypto_core::Operation;
use js_sys::{Array, JsString, Object, Reflect};
use wasm_bindgen::{JsCast, JsValue};

fn invalid(field: &str, reason: &'static str) -> ApiError {
    ApiError::InvalidRequest {
        field: field.into(),
        reason,
    }
}
fn object(value: &JsValue, field: &str, allowed: &[&str]) -> Result<(), ApiError> {
    if !value.is_object() || value.is_null() || Array::is_array(value) {
        return Err(invalid(field, "invalidType"));
    }
    let keys = Reflect::own_keys(value).map_err(|_| ApiError::InternalError)?;
    for key in keys.iter() {
        let Some(name) = key.as_string() else {
            return Err(invalid(field, "unknownField"));
        };
        if !allowed.contains(&name.as_str()) {
            return Err(invalid(&format!("{field}.{name}"), "unknownField"));
        }
    }
    Ok(())
}
fn get(value: &JsValue, name: &str, field: &str) -> Result<JsValue, ApiError> {
    if !Object::has_own(value.unchecked_ref::<Object>(), &JsValue::from_str(name)) {
        return Err(invalid(field, "missing"));
    }
    Reflect::get(value, &JsValue::from_str(name)).map_err(|_| ApiError::InternalError)
}
fn text(value: JsValue, field: &str) -> Result<String, ApiError> {
    if !value.is_string() {
        return Err(invalid(field, "invalidType"));
    }
    let string: JsString = value.unchecked_into();
    if !string.is_valid_utf16() {
        return Err(invalid(field, "invalidUnicode"));
    }
    string.as_string().ok_or(ApiError::InternalError)
}
fn integer(value: JsValue, field: &str) -> Result<i32, ApiError> {
    let number = value
        .as_f64()
        .ok_or_else(|| invalid(field, "invalidType"))?;
    if !number.is_finite() || number.fract() != 0.0 {
        return Err(invalid(field, "notInteger"));
    }
    if number < f64::from(i32::MIN) || number > f64::from(i32::MAX) {
        return Err(invalid(field, "outOfRange"));
    }
    Ok(number as i32)
}
pub fn partial_key(value: JsValue) -> Result<PartialKey, ApiError> {
    object(&value, "request", &["a", "b"])?;
    let parameter = |name| {
        let v = get(&value, name, name)?;
        if v.is_null() {
            Ok(None)
        } else {
            integer(v, name).map(Some)
        }
    };
    Ok(PartialKey {
        a: parameter("a")?,
        b: parameter("b")?,
    })
}
pub fn cipher(value: JsValue) -> Result<Request, ApiError> {
    object(
        &value,
        "request",
        &["algorithm", "operation", "message", "key"],
    )?;
    let algorithm = text(get(&value, "algorithm", "algorithm")?, "algorithm")?;
    if algorithm != "caesar" && algorithm != "affine" {
        return Err(invalid("algorithm", "unsupportedValue"));
    }
    if algorithm == "caesar" {
        object(&value, "request", &["algorithm", "operation", "message"])?;
    }
    let operation = match text(get(&value, "operation", "operation")?, "operation")?.as_str() {
        "encrypt" => Operation::Encrypt,
        "decrypt" => Operation::Decrypt,
        _ => return Err(invalid("operation", "unsupportedValue")),
    };
    let message = text(get(&value, "message", "message")?, "message")?;
    if algorithm == "caesar" {
        return Ok(Request::Caesar { operation, message });
    }
    let key = get(&value, "key", "key")?;
    object(&key, "key", &["a", "b"])?;
    let key = Key {
        a: integer(get(&key, "a", "key.a")?, "key.a")?,
        b: integer(get(&key, "b", "key.b")?, "key.b")?,
    };
    Ok(Request::Affine {
        operation,
        message,
        key,
    })
}
