// Set up the search form to accept user input
function setUpSearchForm() {
  document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const searchQuery = document.getElementById('searchInput').value;
    getSearchResults(searchQuery);
  });
}

// Take user's search query to get the top 20 results for the book/author using the Open Library Search API and store the results
function getSearchResults(searchQuery) {
  
    fetch(`https://openlibrary.org/search.json?q=${searchQuery}&limit=20`)
      .then(response => response.json())
      .then(data => {
        // Store the search results and search query in session storage
        sessionStorage.setItem('searchResults', JSON.stringify(data.docs));
        sessionStorage.setItem('searchQuery', searchQuery);
  
        // Go to the Search Results page
        window.location.href = '/search-results';
      })
      .catch(error => console.error('Error getting search results:', error));
}
  
// Display search results obtained from Open Library to allow books to be added to the library
function displaySearchResults() {
    const searchResults = JSON.parse(sessionStorage.getItem('searchResults'));
    const query = sessionStorage.getItem('searchQuery');

    // Set title on page indicating search query
    const searchQuerySpan = document.getElementById('searchQuery');
    searchQuerySpan.textContent = query;
  
    const resultsContainer = document.querySelector('#boxes .container');
  
    // Iterate through search results and display them on page
    if(searchResults.length > 0) {
      for(const book of searchResults){
        let author;
        let cover;

        // Get author's name or "Unknown Author" if name is unavailable
        if (book.author_name && book.author_name.length > 0) {
          author = book.author_name.join(', '); // join multiple authors together with comma
        } else {
          author = 'Unknown Author';
        }

        // Get book cover or a default cover if unavailable
        if (book.cover_i) {
          cover = `http://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
        } else {
          cover = "/img/defaultCover.jpg";
        }

        displaySearchBook(cover, book.title, author);  
      }
    } else {
      // Display message if no search results for query
      const noResultsMessage = document.createElement('p');
      noResultsMessage.className = 'noResults';
      noResultsMessage.textContent = 'No results found.';
      resultsContainer.appendChild(noResultsMessage);
    }
}

// Creates a new book element for the search results and appends it to the container
function displaySearchBook(bookCover, title, author) {
    const container = document.querySelector('#boxes .container');

    const newBookDiv = document.createElement('div');
    newBookDiv.className = 'book';

    const newImg = document.createElement('img');
    newImg.src = bookCover;
    newBookDiv.appendChild(newImg);

    const newH1 = document.createElement('h1');
    const newSpanTitle = document.createElement('span');

    // + icon to add book to library
    const newSpanAddIcon = document.createElement('span');
    newSpanAddIcon.className = 'add';
    newSpanAddIcon.textContent = '+';

    newSpanTitle.textContent = title;
    newH1.appendChild(newSpanTitle);
    newH1.appendChild(newSpanAddIcon);
    newBookDiv.appendChild(newH1);

    const newPAuthor = document.createElement('p');
    newPAuthor.textContent = author;
    newBookDiv.appendChild(newPAuthor);

    container.appendChild(newBookDiv);
    activeDropDown = null;

    // add dropdown menu for adding to library
    newSpanAddIcon.addEventListener('click', function(event) {
      // Remove any active dropdown menus on the page
      if(activeDropDown) {
         activeDropDown.remove();
      }

      // Create the dropdown menu
      const dropDownMenu = document.createElement('div');
      dropDownMenu.className = 'dropdown';

      // Create the reading list option in the dropdown menu
      const readingListOption = document.createElement('div');
      readingListOption.className = 'option';
      readingListOption.textContent = 'Add Book to Reading List';
      readingListOption.addEventListener('click', function() {
        // Add book to reading list in database
        addBookToDatabase(bookCover, title, author, "FALSE", "FALSE");
        dropDownMenu.remove();
      });

      dropDownMenu.appendChild(readingListOption);

      // Create the completed option in the dropdown menu
      const completedOption = document.createElement('div');
      completedOption.className = 'option';
      completedOption.textContent = 'Add Book to Completed Books';
      completedOption.addEventListener('click', function() {
        // Add book to completed list in database 
        addBookToDatabase(bookCover, title, author, "TRUE", "FALSE");
        dropDownMenu.remove();
      });

      dropDownMenu.appendChild(completedOption);

      // Position the dropdown menu below the "+" symbol
      dropDownMenu.style.top = newSpanAddIcon.offsetTop + newSpanAddIcon.offsetHeight + 'px';
      dropDownMenu.style.left = newSpanAddIcon.offsetLeft + 'px';

      document.body.appendChild(dropDownMenu);

      // Set the activeDropDown to the new dropdown menu
      activeDropDown = dropDownMenu;  

      // Close the dropdown menu when clicking anywhere else on the page
      document.addEventListener('click', function(click) {
        if(!dropDownMenu.contains(click.target)) {
          dropDownMenu.remove();
          activeDropDown = null;
        }
      });

      // Prevent parent event handlers from being executed
      event.stopPropagation();
    });
}

// Uses the user's search query to search the books on the current page
function searchBooksOnPage() {
  // Get the search query field from page
  const searchInput = document.getElementById('searchListInput');

  searchInput.addEventListener('input', function() {
    const searchQuery = searchInput.value.toLowerCase();
    const booksContainer = document.querySelector('#boxes .container');
    const books = booksContainer.getElementsByClassName('book');
  
    // Iterate through all book elements on page and display the books that match the search query
    for(const book of books) {
      // Get the title/author for each book
      const title = book.querySelector('h1 span').textContent.toLowerCase();
      const author = book.querySelector('p').textContent.toLowerCase();
      
      // Show books that contain the search query in their title/author
      if(title.includes(searchQuery) || author.includes(searchQuery)) {
        book.style.display = 'block'; 
      } else {
        book.style.display = 'none';
      }
    }
  });
}
  
// Adds book to database and sets the appropriate list (completed, reading list, favourites)
function addBookToDatabase(bookCover, bookTitle, bookAuthor, bookCompleted, bookFavourited) {

    const bookInfo = {
      title: bookTitle,
      author: bookAuthor, 
      coverPath: bookCover, 
      completed: bookCompleted,
      favourited: bookFavourited
    };
  
    fetch('/add-to-database', {
      method: 'POST',
      body: JSON.stringify(bookInfo),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log(data); 

        if(data.message == 'Book added to the database'){
          // Show success message for book added
          const successMessage = document.getElementById('success-message');
          const bookTitleSpan = document.getElementById('book-title');
          const pageTitleSpan = document.getElementById('page-title');

          bookTitleSpan.textContent = bookTitle;
          if(bookCompleted == "TRUE"){
            pageTitleSpan.textContent = "Completed Books";
          }else{
            pageTitleSpan.textContent = "Reading List";
          }

          // Show the message for 3 seconds
          successMessage.style.display = 'block';
          setTimeout(function() {
              successMessage.style.display = 'none';
          }, 3000); 
        }else{
          // Book already exists in database, show message
          const existsMessage = document.getElementById('exists-message');
          const messageSpan = document.getElementById('message');

          messageSpan.textContent = data.message;

          // Show the message for 3 seconds
          existsMessage.style.display = 'block';
          setTimeout(function() {
            existsMessage.style.display = 'none'; 
          }, 3000); 
        }
      })
      .catch(error => {
        console.error('Error adding book:', error);

        // Show error message for 4 seconds
        const errorMessage = document.getElementById('error-message');
        errorMessage.style.display = 'block';
        setTimeout(function() {
          errorMessage.style.display = 'none'; 
        }, 4000); 
      });
}
  
// Creates a new book element and appends it to the container
function displayBook(bookCover, title, author, completed, favourite) {
  const container = document.querySelector('#boxes .container');

  const newBookDiv = document.createElement('div');
  newBookDiv.className = 'book';

  const newImg = document.createElement('img');
  newImg.src = bookCover;
  newBookDiv.appendChild(newImg);

  const newH1 = document.createElement('h1');
  const newSpanTitle = document.createElement('span');

  // Star icon to favourite books
  const newSpanStarIcon = document.createElement('span');
  newSpanStarIcon.className = 'star';
  if(favourite == "FALSE"){
    newSpanStarIcon.textContent = '\u2606';
  }else{
    newSpanStarIcon.textContent = '\u2605';
  }
  newSpanStarIcon.addEventListener('click', function(event) {
    favouriteBook(this);
  });

  newSpanTitle.textContent = title;
  newH1.appendChild(newSpanTitle);
  newH1.appendChild(newSpanStarIcon);

  // If book is in reading list, add a checkmark icon (to move to completed), if it is completed, add an arrow icon (to move to reading list)
  if(completed == "FALSE"){
    const newSpanCheckmarkIcon = document.createElement('span');
    newSpanCheckmarkIcon.className = 'checkmark'; 
    newSpanCheckmarkIcon.title = 'Add to Completed Books'
    newSpanCheckmarkIcon.textContent = '\u2713'; 
    newSpanCheckmarkIcon.onclick = function() { 
      bookCompleted(this); 
    }; 
    newH1.appendChild(newSpanCheckmarkIcon);
  }else{
    const newSpanArrowIcon = document.createElement('span');
    newSpanArrowIcon.className = 'arrow'; 
    newSpanArrowIcon.title = 'Move to Reading List'
    newSpanArrowIcon.textContent = '\u2192'; 
    newSpanArrowIcon.onclick = function() { 
      bookToReadingList(this); 
    }; 
    newH1.appendChild(newSpanArrowIcon);
  }

  newBookDiv.appendChild(newH1);

  const newPAuthor = document.createElement('p');
  newPAuthor.textContent = author;
  newBookDiv.appendChild(newPAuthor);

  container.appendChild(newBookDiv);

  activeContextMenu = null;

  // Add menu on right click to allow book to be deleted
  newImg.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevent the web page right click menu

    // Remove any active context menus on the page
    if(activeContextMenu) {
      activeContextMenu.remove();
    }

    // Create the context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';

    // Create the delete option in the context menu
    const deleteOption = document.createElement('div');
    deleteOption.className = 'option';
    deleteOption.textContent = 'Delete Book';
    
    // Open the delete confirmation dialog if delete option is selected
    deleteOption.addEventListener('click', function() {
      const customConfirmation = document.getElementById('delete-confirmation');
      const background = document.getElementById('background');
      const bookTitleSpan = document.getElementById('delete-title');
      bookTitleSpan.textContent = title;

      // Display the confirmation dialog and put a barrier over the background so it is disabled
      customConfirmation.style.display = 'block';
      background.style.display = 'block';

      // Delete book from database if user selects "Yes"
      document.getElementById('confirm-button').addEventListener('click', function() {
        customConfirmation.style.display = 'none';
        background.style.display = 'none';
        deleteBook(title, author, newBookDiv);
      });

      // Close confirmation dialog if user selects "No"
      document.getElementById('cancel-button').addEventListener('click', function() {
        customConfirmation.style.display = 'none';
        background.style.display = 'none';
      });

      // Remove the context menu from page after delete option is clicked
      contextMenu.remove(); 
    });

    contextMenu.appendChild(deleteOption);

    // Position the context menu where the user clicks
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.left = event.pageX + 'px';

    document.body.appendChild(contextMenu);

    // Set the activeContextMenu to the new context menu
    activeContextMenu = contextMenu;  

    // Close the context menu if user clicks anywhere else on page
    document.addEventListener('click', function(click) {
      if(!contextMenu.contains(click.target)) {
        contextMenu.remove();
        activeContextMenu = null;
      }
    });
  });
}

// Gathers book information to update the book's status to completed
function bookCompleted(bookCompleteSymbol){
    const bookDiv = bookCompleteSymbol.closest('.book');

    // Get the title and author information from the bookDiv
    const titleElement = bookDiv.querySelector('h1 span');
    const authorElement = bookDiv.querySelector('p');

    const title = titleElement.textContent;
    const author = authorElement.textContent;

    // Update book's completed status in the database to TRUE
    updateBook("completed", "TRUE", title, author, bookDiv);
}

// Gathers book information to update the book's status to move to reading lust
function bookToReadingList(bookMoveSymbol){
    const bookDiv = bookMoveSymbol.closest('.book');

    // Get the title and author information from the bookDiv
    const titleElement = bookDiv.querySelector('h1 span');
    const authorElement = bookDiv.querySelector('p');

    const title = titleElement.textContent;
    const author = authorElement.textContent;

    // Update book's completed status in the database to FALSE
    updateBook("completed", "FALSE", title, author, bookDiv);
}

// Favourties and unfavourites books in the user's library
function favouriteBook(favouriteStar) {
  // Extract book title and author to use to update book's status in database
  const bookDiv = favouriteStar.closest('.book');
  const h1Element = favouriteStar.parentElement;
  const bookTitle = h1Element.firstChild.textContent;

  const bookAuthorElement = bookDiv.querySelector('p');
  const bookAuthor = bookAuthorElement.textContent;

  // If star is unfilled, add to favourites, otherwise remove from favourites. Update book's status in database
  if(favouriteStar.textContent == '\u2606') {
    updateBook("favourite", "TRUE", bookTitle, bookAuthor, bookDiv);
  } else {
    updateBook("favourite", "FALSE", bookTitle, bookAuthor, bookDiv);
  }
}

// Update book's properties in the database
function updateBook(propertyName, propertyValue, bookTitle, bookAuthor, bookDiv) {

    const bookInfo = {
      property: propertyName,
      propertyVal: propertyValue,
      title: bookTitle,
      author: bookAuthor
    };

    fetch('/update-book', {
      method: 'POST',
      body: JSON.stringify(bookInfo),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      let pageName = "";

      if(propertyName == 'completed'){
        if(propertyValue == "TRUE"){
          pageName = "Completed Books";
        }else{
          pageName = "Reading List";
        }
      }else{
          pageName = "Favourites";
      }

      // Prepare message to display
      const successMessage = document.getElementById('success-message');
      const bookTitleSpan = document.getElementById('success-book-title');
      const functionSpan = document.getElementById('function');
      const pageTitleSpan = document.getElementById('page-title');
      bookTitleSpan.textContent = bookTitle;
      pageTitleSpan.textContent = pageName;

      if(propertyName == "favourite" && propertyValue == "FALSE"){
        functionSpan.textContent = "removed from";
      }else{
        functionSpan.textContent = "added to";
      }

      const currentUrl = window.location.href;

      /* Remove book from current page if not on Favourites page or if unfavouriting on favourites page, 
      if on Favourites page and changing property, toggle icon between checkmark and arrow, 
      otherwise toggle favourite star icon */
      if((propertyName == 'completed' && !currentUrl.includes('favourite-books')) || (propertyName == 'favourite' && currentUrl.includes('favourite-books'))){ 
        bookDiv.remove();
      }else if(propertyName == 'completed' && currentUrl.includes('favourite-books')){
        if(propertyValue == "FALSE"){ // moving to reading list, icon change from arrow to check
            const arrowToCheckmark = bookDiv.querySelector('.arrow');
            arrowToCheckmark.className = 'checkmark'; 
            arrowToCheckmark.title = 'Add to Completed Books'
            arrowToCheckmark.textContent = '\u2713'; 
            arrowToCheckmark.onclick = function() { 
              bookCompleted(this); 
            }; 
          }else{ // moving to completed, icon change from checkmark to arrow
            const checkmarkToArrow = bookDiv.querySelector('.checkmark');
            checkmarkToArrow.className = 'arrow'; 
            checkmarkToArrow.title = 'Move to Reading List'
            checkmarkToArrow.textContent = '\u2192'; 
            checkmarkToArrow.onclick = function() { 
              bookToReadingList(this); 
            }; 
          }
      }else{ 
        const favouriteStar = bookDiv.querySelector('.star');
        if(propertyValue == "TRUE"){ 
          favouriteStar.textContent = '\u2605'; // Change to filled star
        }else{ 
          favouriteStar.textContent = '\u2606'; // Change to hollow star
        }
      }
        
      // Show the success message for 3 seconds
      successMessage.style.display = 'block';
      setTimeout(function() {
        successMessage.style.display = 'none'; 
      }, 3000); 
    })
    .catch(error => {
      console.error('Error updating book:', error);

      // Show the error message for 4 seconds
      const errorMessage = document.getElementById('error-message');
      errorMessage.style.display = 'block';
      setTimeout(function() {
        errorMessage.style.display = 'none';
      }, 4000); 
    });
}

// Delete book from the database
function deleteBook(bookTitle, bookAuthor, bookDiv) {

    const bookInfo = {
      title: bookTitle,
      author: bookAuthor
    };

    fetch('/delete-book', {
      method: 'POST',
      body: JSON.stringify(bookInfo),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log(data); 

      bookDiv.remove();

      const deleteMessage = document.getElementById('delete-message');
      const bookTitleSpan = document.getElementById('delete-book-title');
      bookTitleSpan.textContent = bookTitle;
      
      // Show delete success message for 3 seconds
      deleteMessage.style.display = 'block';
      setTimeout(function() {
        deleteMessage.style.display = 'none';
      }, 3000);
    })
    .catch(error => {
      console.error('Error deleting book:', error);

      // Show the error message for 4 seconds
      const errorMessage = document.getElementById('error-message');
      errorMessage.style.display = 'block';
      setTimeout(function() {
        errorMessage.style.display = 'none'; 
      }, 4000);
    });
}

// Display books on page according to a property name and value from database 
function displayPageBooks(property, propertyVal){

  fetch("/get-books?property="+property+"&propertyValue="+propertyVal)
  .then(response => response.json())
  .then(data => {

    // If no results for current page, display message, otherwise display all books
    if(data.books.length == 0){
      const noResultsMessage = document.createElement('p');
      noResultsMessage.className = 'noResults';
      const container = document.querySelector('#boxes .container');

      if(property == "favourite"){
        noResultsMessage.textContent = 'No favourited books. Search for books using the search field and add them to favourites.';
      }else{ // property is "completed" (either true or false)
        if(propertyVal == "TRUE"){
          noResultsMessage.textContent = 'No completed books. Search for books to add using the search field.';
        }else{
          noResultsMessage.textContent = 'No books in reading list. Search for books to add using the search field.';
        }
      }

      container.appendChild(noResultsMessage);
    }else{
      for(const book of data.books){
        displayBook(book.coverPath, book.title, book.author, book.completed, book.favourite);     
      }
    }
  })
  .catch(error => console.error('Error getting books:', error));
}


setUpSearchForm();