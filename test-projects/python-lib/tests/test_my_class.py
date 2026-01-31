from python_lib import MyClass


def test_default_initialization():
    my_instance = MyClass()
    assert my_instance.name == 'python-lib'
    assert my_instance.greet() == 'Hello, python-lib!'


def test_custom_initialization():
    custom_name = 'Alice'
    my_instance = MyClass(name=custom_name)
    assert my_instance.name == custom_name
    assert my_instance.greet() == f'Hello, {custom_name}!'
