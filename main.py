import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

bookVault = Flask(__name__)

# Allows requests to be sent to server from different domains
CORS(bookVault)

# Connect to the SQLite database and create a cursor to execute queries
connection = sqlite3.connect('bookLibrary.db')
cursor = connection.cursor()

# Create table to store books (for completed, TRUE - Completed page, False - Reading List page )
cursor.execute('''
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        coverPath TEXT,
        completed TEXT, 
        favourite TEXT
    )
''')


# Add book to database
@bookVault.route('/add-to-database', methods=['POST'])
def addToDatabase(): 
    try:
        bookInfo = request.json
        title = bookInfo['title']
        author = bookInfo['author']
        coverPath = bookInfo['coverPath']
        completed = bookInfo['completed']
        favourited = bookInfo['favourited']

        # Connect to the SQLite database
        connection = sqlite3.connect('bookLibrary.db')
        cursor = connection.cursor()

        # Check if the book with the same title and author already exists
        cursor.execute('SELECT * FROM books WHERE title = ? AND author = ?', (title, author))
        existingBook = cursor.fetchone()

        # If book already exists, show a message to the user, otherwise add to database
        if existingBook:
            completedStatus = existingBook[4]
            if completedStatus == 'TRUE':
                message = 'Book already exists in Completed Books!'
            else:
                message = 'Book already exists in Reading List!'
        else:
            cursor.execute('INSERT INTO books (title, author, coverPath, completed, favourite) VALUES (?, ?, ?, ?, ?)', 
                           (title, author, coverPath, completed, favourited))
            message = 'Book added to the database'

        # Commit the changes to the database and close connection
        connection.commit()
        connection.close()

        return jsonify({'message': message}), 200
    
    except Exception as error:
        return jsonify({'error': str(error)}), 500
    

# Delete book from database using its title and author
@bookVault.route('/delete-book', methods=['POST'])
def deleteBook():
    try:
        bookInfo = request.json
        title = bookInfo['title']
        author = bookInfo['author']

        # Connect to the SQLite database
        connection = sqlite3.connect('bookLibrary.db')
        cursor = connection.cursor()

        # Delete the book from the database
        cursor.execute('DELETE FROM books WHERE title = ? AND author = ?', (title, author))

        # Commit the changes to the database and close connection
        connection.commit()
        connection.close()

        return jsonify({'message': 'Book deleted'}), 200
    
    except Exception as error:
        return jsonify({'error': str(error)}), 500
    

# Get all books with a specific property and value 
@bookVault.route('/get-books', methods=['GET'])
def getBooks():
    try:
        # Get the property and property value from query parameters
        property = request.args['property']
        propertyVal = request.args['propertyValue'] 
        
        # Connect to the SQLite database
        connection = sqlite3.connect('bookLibrary.db')
        cursor = connection.cursor()

        # Get all books with the property and its value, ordered by ID, to get the most recently added books first 
        query = f'SELECT * FROM books WHERE {property} = ? ORDER BY id DESC'
        cursor.execute(query, (propertyVal,))
        books = cursor.fetchall()

        # Store the information in JSON format
        bookList = []
        for book in books:
            bookInfo = {
                'id': book[0],
                'title': book[1],
                'author': book[2],
                'coverPath': book[3],
                'completed': book[4],
                'favourite': book[5]
            }
            bookList.append(bookInfo)

        return jsonify({'books': bookList}), 200

    except Exception as error:
        return jsonify({'error': str(error)}), 500
    

# Update the property of a book
@bookVault.route('/update-book', methods=['POST'])
def updateBook():
    try:
        bookInfo = request.json
        title = bookInfo['title']
        author = bookInfo['author']
        propertyName = bookInfo['property']
        propertyValue = bookInfo['propertyVal']

        # Connect to the SQLite database
        connection = sqlite3.connect('bookLibrary.db')
        cursor = connection.cursor()

        # Update the status of the book in the database
        query = f'UPDATE books SET {propertyName} = ? WHERE title = ? AND author = ?'
        cursor.execute(query, (propertyValue, title, author))

        # Commit the changes to the database and close connection
        connection.commit()
        connection.close()

        return jsonify({'message': 'Book status updated!'}), 200

    except Exception as error:
        return jsonify({'error': str(error)}), 500


if __name__ == '__main__':
    bookVault.run()