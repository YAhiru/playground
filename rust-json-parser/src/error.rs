#[derive(Debug, PartialEq, Clone)]
pub enum ParseError {
    UnexpectedTokenError,
    UnclosedQuotationError,
    UnclosedListError,
    UnclosedObjectError,
}
