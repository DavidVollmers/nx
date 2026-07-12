<% if (framework === 'fastapi') { -%>
from fastapi import FastAPI

app = FastAPI()


@app.get('/hello')
def hello() -> dict[str, str]:
    return {'message': 'Hello, <%= name %>!'}
<% } else { -%>
def main() -> None:
    print('Hello, <%= name %>!')


if __name__ == '__main__':
    main()
<% } -%>
