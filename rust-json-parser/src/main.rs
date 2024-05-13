pub mod error;
mod lexer;
pub mod parser;

use crate::parser::Parser;
use std::io::Read;

fn main() {
    let mut buffer = String::new();
    let mut stdin = std::io::stdin();
    let parser = Parser {};

    match stdin.read_to_string(&mut buffer) {
        Ok(_) => (),
        Err(e) => panic!("{:?}", e),
    }

    match parser.parse(buffer.as_str()) {
        Ok(json) => println!("{:?}", json),
        Err(e) => panic!("{:?}", e),
    }
}
