class MyClass:
    def __init__(self, name: str = '<%= name %>'):
        self.name = name

    def greet(self) -> str:
        return f'Hello, {self.name}!'
