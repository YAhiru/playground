package go_snowflake_id_parser

import (
	"fmt"
	"regexp"
	"slices"
	"strings"
)

// https://docs.snowflake.com/ja/sql-reference/identifiers
// https://docs.snowflake.com/ja/sql-reference/identifiers-syntax
// https://docs.snowflake.com/ja/developer-guide/udf-stored-procedure-naming-conventions

type DataType string

type Argument struct {
	Name string
	Type DataType
}
type FullyQualifiedIdentifier struct {
	Part1      string
	Part2      string
	Part3      string
	Part4      string
	Arguments  []Argument
	ReturnType *DataType
}

type Lexer struct {
	position int
	chars    []byte
}
type TokenKind int

const (
	TokenKindString TokenKind = iota
	TokenKindArguments
	TokenKindDataType
	TokenKindDelimiter
	TokenKindReturns
	TokenKindEOS
)

func (l *Lexer) Next() (Token, error) {
	l.ConsumeSpace()

	if l.position >= len(l.chars) {
		return Token{Kind: TokenKindEOS}, nil
	}

	c := l.chars[l.position]
	if c == '.' {
		l.position++
		return Token{Kind: TokenKindDelimiter}, nil
	} else if c == '"' {
		return l.processQuotedString()
	} else if c == '(' {
		return l.processArguments()
	}

	maybeReturns := l.chars[l.position : l.position+8]
	if strings.ToUpper(string(maybeReturns)) == "RETURNS " {
		return l.processReturns()
	}

	return l.processString()
}

func (l *Lexer) ConsumeSpace() {
	for len(l.chars) > l.position && l.chars[l.position] == ' ' {
		l.position++
	}
}

var allowedFirstChars = regexp.MustCompile(`^[a-zA-Z_]$`)

func (l *Lexer) processString() (Token, error) {
	var v []byte

	c := l.chars[l.position]
	if !allowedFirstChars.MatchString(string(c)) {
		return Token{}, fmt.Errorf("invalid character: %s", string(c))
	}

	for len(l.chars) > l.position {
		c = l.chars[l.position]

		if l.chars[l.position] == '.' || l.chars[l.position] == '(' {
			break
		}

		l.position++
		v = append(v, c)
	}

	return Token{Kind: TokenKindString, Value: strings.ToUpper(string(v))}, nil
}

func (l *Lexer) processQuotedString() (Token, error) {
	l.position++

	var v []byte
	for len(l.chars) > l.position {
		c := l.chars[l.position]
		l.position++

		if c == '"' {
			if len(l.chars) > l.position && l.chars[l.position] == '"' {
				// 次の文字が " ならばエスケープ
				v = append(v, '"')
				l.position++
				continue
			} else {
				// エスケープでないなら識別子終了
				break
			}
		}

		v = append(v, c)
	}

	return Token{Kind: TokenKindString, Value: string(v)}, nil
}

func (l *Lexer) processArguments() (Token, error) {
	l.position++

	args := make([]Argument, 0)
	for len(l.chars) > l.position {
		c := l.chars[l.position]

		if c == ')' {
			l.position++
			break
		}
		if c == ' ' || c == ',' {
			l.position++
			continue
		}

		arg, err := l.processDataType()
		if err != nil {
			return Token{}, err
		}
		args = append(args, Argument{Type: arg.GetDataTypeValue()})
	}

	return Token{
		Kind:  TokenKindArguments,
		Value: args,
	}, nil
}

func (l *Lexer) processDataType() (Token, error) {
	var v []byte
	for len(l.chars) > l.position {
		c := l.chars[l.position]

		if c == ',' || c == ')' {
			break
		}

		l.position++
		v = append(v, c)
	}

	return Token{
		Kind:  TokenKindDataType,
		Value: DataType(strings.ToUpper(string(v))),
	}, nil
}

func (l *Lexer) processReturns() (Token, error) {
	l.position += 8

	t, err := l.processDataType()
	if err != nil {
		return Token{}, err
	}

	return Token{
		Kind:  TokenKindReturns,
		Value: t.GetDataTypeValue(),
	}, nil
}

type Parser struct {
}

type Token struct {
	Kind  TokenKind
	Value interface{}
}

func (t *Token) IsString() bool {
	return t.Kind == TokenKindString
}

func (t *Token) GetStringValue() string {
	return t.Value.(string)
}

func (t *Token) GetArgumentsValue() []Argument {
	return t.Value.([]Argument)
}

func (t *Token) GetDataTypeValue() DataType {
	return t.Value.(DataType)
}

func (t *Token) IsEOS() bool {
	return t.Kind == TokenKindEOS
}

func (t *Token) IsDelimiter() bool {
	return t.Kind == TokenKindDelimiter
}

func (t *Token) IsArguments() bool {
	return t.Kind == TokenKindArguments
}

func (t *Token) IsReturns() bool {
	return t.Kind == TokenKindReturns
}

func (p *Parser) Parse(id string) (FullyQualifiedIdentifier, error) {
	lexer := Lexer{chars: []byte(id)}
	i := FullyQualifiedIdentifier{}
	want := []TokenKind{TokenKindString}
	for {
		t, err := lexer.Next()
		if err != nil {
			return FullyQualifiedIdentifier{}, err
		}

		if !slices.Contains(want, t.Kind) {
			return FullyQualifiedIdentifier{}, fmt.Errorf("unexpected token wont=%v got=%v", want, t.Kind)
		}

		if t.IsString() {
			if i.Part1 == "" {
				i.Part1 = t.GetStringValue()
				want = []TokenKind{TokenKindDelimiter, TokenKindEOS}
			} else if i.Part2 == "" {
				i.Part2 = t.GetStringValue()
				want = []TokenKind{TokenKindDelimiter, TokenKindEOS}
			} else if i.Part3 == "" {
				i.Part3 = t.GetStringValue()
				want = []TokenKind{TokenKindDelimiter, TokenKindEOS, TokenKindArguments}
			} else if i.Part4 == "" {
				i.Part4 = t.GetStringValue()
				want = []TokenKind{TokenKindEOS}
			} else {
				panic("ロジックがおかしい")
			}
		} else if t.IsDelimiter() {
			want = []TokenKind{TokenKindString}
		} else if t.IsEOS() {
			return i, nil
		} else if t.IsArguments() {
			i.Arguments = t.GetArgumentsValue()
			want = []TokenKind{TokenKindEOS, TokenKindReturns}
		} else if t.IsReturns() {
			dt := t.GetDataTypeValue()
			i.ReturnType = &dt
			want = []TokenKind{TokenKindEOS}
		}
	}
}
