from <%= module %> import MyClass

def test_default_initialization():
    my_instance = MyClass()
    assert my_instance.name == '<%= name %>'
    assert my_instance.greet() == 'Hello, <%= name %>!'

def test_custom_initialization():
    custom_name = 'Alice'
    my_instance = MyClass(name=custom_name)
    assert my_instance.name == custom_name
    assert my_instance.greet() == f'Hello, {custom_name}!'
