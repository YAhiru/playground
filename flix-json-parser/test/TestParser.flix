@Test
def parse01(): Bool = Assert.eq(JsonValue.Number(1.0), Parser.parse("1"))
