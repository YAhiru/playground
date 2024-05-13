use crate::error::ParseError;
use crate::error::ParseError::{UnclosedQuotationError, UnexpectedTokenError};

pub struct Lexer {
    position: usize,
    json_str: Vec<char>,
    max_position: usize,
}

#[derive(Debug)]
pub enum Token {
    Str(String),
    Num(f32),
    Bool(bool),
    Null(),
    StartBrace(),
    EndBrace(),
    StartBracket(),
    EndBracket(),
    Comma(),
    Colon(),
    EOF(),
}

impl Lexer {
    pub fn new(json_str: &str) -> Lexer {
        Lexer {
            position: 0,
            json_str: json_str.chars().collect(),
            max_position: json_str.len(),
        }
    }

    pub fn has_next(&self) -> bool {
        self.position < self.max_position
    }

    fn current(&self) -> char {
        self.json_str[self.position]
    }

    fn move_forward(&mut self, n: usize) {
        if self.position + n > self.max_position {
            panic!("Out of range")
        }

        self.position += n;
    }

    pub fn next_token(&mut self) -> Result<Token, ParseError> {
        while self.has_next() {
            let c = self.current();
            match c {
                ' ' | '\n' | '\t' | '\r' => {
                    self.move_forward(1);
                    continue;
                }
                '"' => {
                    return self.read_string();
                }
                '-' | '0'..='9' => {
                    return self.read_number();
                }
                'n' => return self.read_keyword("null"),
                't' => return self.read_keyword("true"),
                'f' => {
                    return self.read_keyword("false");
                }
                '[' => {
                    self.move_forward(1);
                    return Ok(Token::StartBrace());
                }
                ']' => {
                    self.move_forward(1);
                    return Ok(Token::EndBrace());
                }
                ',' => {
                    self.move_forward(1);
                    return Ok(Token::Comma());
                }
                '{' => {
                    self.move_forward(1);
                    return Ok(Token::StartBracket());
                }
                '}' => {
                    self.move_forward(1);
                    return Ok(Token::EndBracket());
                }
                ':' => {
                    self.move_forward(1);
                    return Ok(Token::Colon());
                }
                _ => {
                    return Err(UnexpectedTokenError);
                }
            }
        }

        return Ok(Token::EOF());
    }

    fn read_string(&mut self) -> Result<Token, ParseError> {
        let mut s = String::new();
        self.move_forward(1);

        while self.has_next() {
            let c = self.current();
            // todo: support escape
            match c {
                '"' => {
                    self.move_forward(1);
                    return Ok(Token::Str(s));
                }
                _ => {
                    s.push(c);
                    self.move_forward(1);
                }
            }
        }

        Err(UnclosedQuotationError)
    }

    fn read_number(&mut self) -> Result<Token, ParseError> {
        let mut num = String::new();
        while self.has_next() {
            let c = self.current();
            match c {
                '-' | '0'..='9' | '.' => {
                    num.push(c);
                    self.move_forward(1);
                }
                _ => {
                    break;
                }
            }
        }

        match num.parse() {
            Ok(n) => Ok(Token::Num(n)),
            Err(_) => Err(UnexpectedTokenError),
        }
    }

    fn read_keyword(&mut self, keyword: &str) -> Result<Token, ParseError> {
        let mut buff = String::new();
        for i in 0..keyword.len() {
            let c = self.json_str.get(self.position + i);
            match c {
                Some(c) => buff.push(*c),
                None => return Err(UnexpectedTokenError),
            }
        }

        match keyword {
            "null" => {
                self.move_forward(keyword.len());
                Ok(Token::Null())
            }
            "true" => {
                self.move_forward(keyword.len());
                Ok(Token::Bool(true))
            }
            "false" => {
                self.move_forward(keyword.len());
                Ok(Token::Bool(false))
            }
            _ => Err(UnexpectedTokenError),
        }
    }
}
