use rust_json_parser::error::ParseError;
use rust_json_parser::parser::JsonValue::{Bool, List, Null, Num, Object, Str};
use rust_json_parser::parser::{JsonValue, Parser};
use std::collections::HashMap;

#[test]
fn parse_str() {
    struct TestCase {
        json_str: &'static str,
        expected: Result<JsonValue, ParseError>,
    }
    let testcases = [
        TestCase {
            json_str: "\"abc\"",
            expected: Ok(Str("abc".to_string())),
        },
        TestCase {
            json_str: "\"def\"",
            expected: Ok(Str("def".to_string())),
        },
        TestCase {
            json_str: "    \"abc\"    ",
            expected: Ok(Str("abc".to_string())),
        },
        TestCase {
            json_str: "\"abc",
            expected: Err(ParseError::UnclosedQuotationError),
        },
        TestCase {
            json_str: "abc\"",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "abc",
            expected: Err(ParseError::UnexpectedTokenError),
        },
    ];

    let p = Parser {};

    for tc in testcases.iter() {
        assert_eq!(p.parse(tc.json_str), tc.expected)
    }
}

#[test]
fn parse_null() {
    struct TestCase {
        json_str: &'static str,
        expected: Result<JsonValue, ParseError>,
    }
    let testcases = [
        TestCase {
            json_str: "null",
            expected: Ok(Null()),
        },
        TestCase {
            json_str: " null ",
            expected: Ok(Null()),
        },
        TestCase {
            json_str: "nul",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "nulll",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "nullnull",
            expected: Err(ParseError::UnexpectedTokenError),
        },
    ];

    let p = Parser {};

    for tc in testcases.iter() {
        assert_eq!(p.parse(tc.json_str), tc.expected)
    }
}
#[test]
fn parse_bool() {
    struct TestCase {
        json_str: &'static str,
        expected: Result<JsonValue, ParseError>,
    }
    let testcases = [
        TestCase {
            json_str: "true",
            expected: Ok(Bool(true)),
        },
        TestCase {
            json_str: " true ",
            expected: Ok(Bool(true)),
        },
        TestCase {
            json_str: "false",
            expected: Ok(Bool(false)),
        },
        TestCase {
            json_str: " false ",
            expected: Ok(Bool(false)),
        },
        TestCase {
            json_str: "truefalse",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "truee",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "falsee",
            expected: Err(ParseError::UnexpectedTokenError),
        },
    ];

    let p = Parser {};

    for tc in testcases.iter() {
        assert_eq!(p.parse(tc.json_str), tc.expected)
    }
}

#[test]
fn parse_number() {
    struct TestCase {
        json_str: &'static str,
        expected: Result<JsonValue, ParseError>,
    }
    let testcases = [
        TestCase {
            json_str: "123",
            expected: Ok(Num(123.0)),
        },
        TestCase {
            json_str: "1.23",
            expected: Ok(Num(1.23)),
        },
        TestCase {
            json_str: "1.230",
            expected: Ok(Num(1.23)),
        },
        TestCase {
            json_str: "-1",
            expected: Ok(Num(-1.0)),
        },
        TestCase {
            json_str: "-1.23",
            expected: Ok(Num(-1.23)),
        },
        TestCase {
            json_str: ".12",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "1.2.3",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "1-",
            expected: Err(ParseError::UnexpectedTokenError),
        },
    ];

    let p = Parser {};

    for tc in testcases.iter() {
        assert_eq!(p.parse(tc.json_str), tc.expected)
    }
}

#[test]
fn parse_list() {
    struct TestCase {
        json_str: &'static str,
        expected: Result<JsonValue, ParseError>,
    }
    let testcases = [
        TestCase {
            json_str: "[]",
            expected: Ok(List(Box::new([]))),
        },
        TestCase {
            json_str: "[123]",
            expected: Ok(List(Box::new([Num(123.0)]))),
        },
        TestCase {
            json_str: "[123, 456]",
            expected: Ok(List(Box::new([Num(123.0), Num(456.0)]))),
        },
        TestCase {
            json_str: "[[123, 456]]",
            expected: Ok(List(Box::new([List(Box::new([Num(123.0), Num(456.0)]))]))),
        },
        TestCase {
            json_str: "[",
            expected: Err(ParseError::UnclosedListError),
        },
        TestCase {
            json_str: "]",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: ",",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "[,123]",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "[123,]",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "[123, ,456]",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "[123 \"abc\"]",
            expected: Err(ParseError::UnexpectedTokenError),
        },
    ];

    let p = Parser {};

    for tc in testcases.iter() {
        assert_eq!(p.parse(tc.json_str), tc.expected)
    }
}

#[test]
fn parse_object() {
    struct TestCase {
        json_str: &'static str,
        expected: Result<JsonValue, ParseError>,
    }
    let testcases = [
        TestCase {
            json_str: "{}",
            expected: Ok(Object(HashMap::new())),
        },
        TestCase {
            json_str: "{ \"key\": \"value\" }",
            expected: Ok(Object(HashMap::from([(
                "key".to_string(),
                Str("value".to_string()),
            )]))),
        },
        TestCase {
            json_str: "{ \"key1\": 1, \"key2\": 2 }",
            expected: Ok(Object(HashMap::from([
                ("key1".to_string(), Num(1.0)),
                ("key2".to_string(), Num(2.0)),
            ]))),
        },
        TestCase {
            json_str: "{ \"nest\": { \"key\": \"value\" } }",
            expected: Ok(Object(HashMap::from([(
                "nest".to_string(),
                Object(HashMap::from([(
                    "key".to_string(),
                    Str("value".to_string()),
                )])),
            )]))),
        },
        TestCase {
            json_str: "{",
            expected: Err(ParseError::UnclosedObjectError),
        },
        TestCase {
            json_str: "{\"key\"}",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "{\"key\":}",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "{:}",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "{:\"value\"}",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "{,}",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "{ \"key\": \"value\", }",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "{ ,\"key\": \"value\" }",
            expected: Err(ParseError::UnexpectedTokenError),
        },
        TestCase {
            json_str: "{ \"key1\": \"value1\" \"no\": \"comma\" }",
            expected: Err(ParseError::UnexpectedTokenError),
        },
    ];

    let p = Parser {};

    for tc in testcases.iter() {
        assert_eq!(p.parse(tc.json_str), tc.expected)
    }
}
