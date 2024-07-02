enum JsonValue with Eq {
    case Number(Float64)
}

instance ToString[JsonValue] {
    pub def toString(x: JsonValue): String = match x {
        case JsonValue.Number(n) if Float64.floor(n) == n => match Float64.tryToInt32(n) {
            case Some(nn) => "${nn}"
            case None => "${n}"
        }
        case JsonValue.Number(n) => "${n}"
    }
}

mod Parser {
    pub def parse(_: String): JsonValue = JsonValue.Number(1.0)
}

type alias Consumption = {
    position = Int32,
    content = String
}

enum Token with Eq {
    case Number(Float64)
}

mod Lexer {
    pub def mk(content: String): Consumption = {
        position = 0,
        content = content
    }

    pub def next(c: Consumption): (Consumption, Token) = (
        {
            position = c.position + 1,
            content = c.content
        },
        Token.Number(1.0)
    )
}
