from hello import greet


def test_cumprimenta_alice():
    """Cumprimenta Alice — Dado/Quando/Então from specs/hello.md."""
    assert greet("Alice") == "Hello, Alice!"
