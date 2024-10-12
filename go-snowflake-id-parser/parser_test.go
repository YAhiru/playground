package go_snowflake_id_parser

import (
	"github.com/google/go-cmp/cmp"
	"testing"
)

// https://docs.snowflake.com/ja/sql-reference/identifiers
// https://docs.snowflake.com/ja/sql-reference/identifiers-syntax
// https://docs.snowflake.com/ja/developer-guide/udf-stored-procedure-naming-conventions

func ptr[T any](v T) *T {
	return &v
}

func TestParser(t *testing.T) {
	type test struct {
		input string
		want  FullyQualifiedIdentifier
	}

	tests := []test{
		{input: "MY_DB", want: FullyQualifiedIdentifier{Part1: "MY_DB"}},
		{input: "my_db", want: FullyQualifiedIdentifier{Part1: "MY_DB"}},
		{input: "\"my_db\"", want: FullyQualifiedIdentifier{Part1: "my_db"}},
		{input: "\"my\"\"_db\"", want: FullyQualifiedIdentifier{Part1: "my\"_db"}},
		{input: "\"my_db\"\"\"", want: FullyQualifiedIdentifier{Part1: "my_db\""}},
		{input: "\"\"\"my_db\"", want: FullyQualifiedIdentifier{Part1: "\"my_db"}},
		{input: "\"my.db\"", want: FullyQualifiedIdentifier{Part1: "my.db"}},
		{input: "MY_DB.MY_SCHEMA", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA"}},
		{input: "MY_DB.my_schema", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA"}},
		{input: "MY_DB.\"my_schema\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "my_schema"}},
		{input: "MY_DB.\"my\"\"_schema\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "my\"_schema"}},
		{input: "MY_DB.\"my_schema\"\"\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "my_schema\""}},
		{input: "MY_DB.\"\"\"my_schema\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "\"my_schema"}},
		{input: "MY_DB.\"my.schema\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "my.schema"}},
		{input: "MY_DB.MY_SCHEMA.MY_TABLE", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_TABLE"}},
		{input: "MY_DB.MY_SCHEMA.my_table", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_TABLE"}},
		{input: "MY_DB.MY_SCHEMA.\"my_table\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "my_table"}},
		{input: "MY_DB.MY_SCHEMA.\"my\"\"_table\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "my\"_table"}},
		{input: "MY_DB.MY_SCHEMA.\"my_table\"\"\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "my_table\""}},
		{input: "MY_DB.MY_SCHEMA.\"\"\"my_table\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "\"my_table"}},
		{input: "MY_DB.MY_SCHEMA.\"my.table\"", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "my.table"}},
		{input: "MY_DB.MY_SCHEMA.MY_PROCEDURE()", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_PROCEDURE", Arguments: make([]Argument, 0)}},
		{input: "MY_DB.MY_SCHEMA.\"MY_PROCEDURE\"()", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_PROCEDURE", Arguments: make([]Argument, 0)}},
		{input: "MY_DB.MY_SCHEMA.MY_PROCEDURE(VARCHAR)", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_PROCEDURE", Arguments: []Argument{{Type: "VARCHAR"}}}},
		{input: "MY_DB.MY_SCHEMA.MY_PROCEDURE(varchar)", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_PROCEDURE", Arguments: []Argument{{Type: "VARCHAR"}}}},
		{input: "MY_DB.MY_SCHEMA.MY_PROCEDURE(VARCHAR, NUMBER)", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_PROCEDURE", Arguments: []Argument{{Type: "VARCHAR"}, {Type: "NUMBER"}}}},
		{input: "MY_DB.MY_SCHEMA.MY_PROCEDURE() RETURNS VARCHAR", want: FullyQualifiedIdentifier{Part1: "MY_DB", Part2: "MY_SCHEMA", Part3: "MY_PROCEDURE", Arguments: make([]Argument, 0), ReturnType: ptr(DataType("VARCHAR"))}},
	}
	for _, tc := range tests {
		t.Run("parse: "+tc.input, func(t *testing.T) {
			p := Parser{}
			parse, err := p.Parse(tc.input)
			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if diff := cmp.Diff(tc.want, parse); diff != "" {
				t.Errorf("unexpected diff (-want, +got): %v", diff)
			}
		})
	}
}
