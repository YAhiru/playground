use crate::error::ParseError;
use crate::error::ParseError::{UnclosedListError, UnclosedObjectError, UnexpectedTokenError};
use crate::lexer::{Lexer, Token};
use std::collections::HashMap;

pub struct Parser {}

#[derive(Debug, PartialEq, Clone)]
pub enum JsonValue {
    Str(String),
    Num(f32),
    Bool(bool),
    Null(),
    List(Box<[JsonValue]>),
    Object(HashMap<String, JsonValue>),
}

impl Parser {
    pub fn parse(&self, json_str: &str) -> Result<JsonValue, ParseError> {
        let mut lexer = Lexer::new(json_str);
        let v = self.do_parse(lexer.next_token(), &mut lexer);

        v.and_then(|v| match lexer.next_token() {
            Ok(Token::EOF()) => Ok(v),
            _ => Err(UnexpectedTokenError),
        })
    }

    fn do_parse(
        &self,
        token: Result<Token, ParseError>,
        lexer: &mut Lexer,
    ) -> Result<JsonValue, ParseError> {
        match token {
            Ok(Token::Str(s)) => Ok(JsonValue::Str(s)),
            Ok(Token::Num(n)) => Ok(JsonValue::Num(n)),
            Ok(Token::Null()) => Ok(JsonValue::Null()),
            Ok(Token::Bool(b)) => Ok(JsonValue::Bool(b)),
            Ok(Token::StartBrace()) => self.parse_list(lexer),
            Ok(Token::StartBracket()) => self.parse_object(lexer),
            Ok(Token::EndBrace())
            | Ok(Token::Comma())
            | Ok(Token::EndBracket())
            | Ok(Token::Colon())
            | Ok(Token::EOF()) => Err(UnexpectedTokenError),
            Err(e) => Err(e),
        }
    }

    fn parse_list(&self, lexer: &mut Lexer) -> Result<JsonValue, ParseError> {
        let mut list = Vec::new();
        struct Want {
            end_brace: bool,
            value: bool,
            comma: bool,
        }
        let mut want = Want {
            end_brace: true,
            value: true,
            comma: false,
        };

        loop {
            let token = lexer.next_token();
            match token {
                Ok(Token::EndBrace()) => {
                    if !want.end_brace {
                        return Err(UnexpectedTokenError);
                    }

                    return Ok(JsonValue::List(list.into_boxed_slice()));
                }
                Ok(Token::Comma()) => {
                    if !want.comma {
                        return Err(UnexpectedTokenError);
                    }

                    want = Want {
                        end_brace: false,
                        value: true,
                        comma: false,
                    };
                }
                Ok(Token::EOF()) => {
                    return Err(UnclosedListError);
                }
                Ok(_) => {
                    if !want.value {
                        return Err(UnexpectedTokenError);
                    }

                    match self.do_parse(token, lexer) {
                        Ok(v) => {
                            list.push(v);
                            want = Want {
                                end_brace: true,
                                value: false,
                                comma: true,
                            };
                        }
                        Err(e) => return Err(e),
                    }
                }
                Err(e) => return Err(e),
            }
        }
    }

    fn parse_object(&self, lexer: &mut Lexer) -> Result<JsonValue, ParseError> {
        let mut map = HashMap::new();
        struct Want {
            end_bracket: bool,
            key: bool,
            comma: bool,
        }
        let mut want = Want {
            end_bracket: true,
            key: true,
            comma: false,
        };

        loop {
            let token = lexer.next_token();
            match token {
                Ok(Token::EndBracket()) => {
                    if !want.end_bracket {
                        return Err(UnexpectedTokenError);
                    }

                    return Ok(JsonValue::Object(map));
                }
                Ok(Token::EOF()) => {
                    return Err(UnclosedObjectError);
                }
                Ok(Token::Comma()) => {
                    if !want.comma {
                        return Err(UnexpectedTokenError);
                    }

                    want = Want {
                        end_bracket: false,
                        key: true,
                        comma: false,
                    };
                }
                Ok(t) => {
                    if !want.key {
                        return Err(UnexpectedTokenError);
                    }

                    let key = match t {
                        Token::Str(s) => s,
                        _ => return Err(UnexpectedTokenError),
                    };
                    let value = lexer
                        .next_token()
                        .and_then(|t| match t {
                            Token::Colon() => Ok(()),
                            _ => Err(UnexpectedTokenError),
                        })
                        .and_then(|_| self.do_parse(lexer.next_token(), lexer));

                    match value {
                        Ok(v) => {
                            want = Want {
                                end_bracket: true,
                                key: false,
                                comma: true,
                            };
                            map.insert(key, v);
                        }
                        _ => return Err(UnexpectedTokenError),
                    }
                }
                Err(e) => return Err(e),
            }
        }
    }
}
