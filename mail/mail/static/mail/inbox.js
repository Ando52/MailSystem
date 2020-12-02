document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');

  //document.querySelector('#compose-submit').addEventListener('click', send_email);
  // for when the user presses  
  send_email();


});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show the emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    for (i=0; i<emails.length; i++){
      add_email(emails[i], mailbox);
    }

    // gets a list and calls add_email function to each email object
  });
}

function send_email() {

  document.querySelector('#compose-form').onsubmit = () =>{

    //Gets all the data from the html
    const msg = document.getElementById('compose-recipients');
    
    const recipients_in = document.getElementById('compose-recipients').value;
    const subject_line = document.getElementById('compose-subject').value;
    const body_in = document.getElementById('compose-body').value;
    
    // Post the email data to the server
    fetch('/emails',{
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients_in,
        subject: subject_line,
        body: body_in
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.status == 201){
        load_mailbox('sent');
      }
    })
    .catch(error => {
      console.log(error);
    });
  }
  
}    

function add_email(data, mailbox){
  var sender = data.sender;
  const recipients_len = data.recipients.length;

  // Shows the people who the user sent the email to in the sent mailbox
  if (mailbox == 'sent'){
    sender = "To: " + data.recipients[0];
    if (recipients_len > 1){
      sender = sender + `(${recipients_len})`;
    }
  }

  console.log(sender)
  // Creates email
  const email_element = document.createElement('div');
  email_element.className = "email";
  email_element.innerHTML = `<h4 id="sender">${sender}:</h4> <p id="subject-line">${data.subject}</p> <p id="timestamp">${data.timestamp}</p>`;
  
  email_element.addEventListener('click', function() {

    // When button is clicked and not looking at sent box it will mark email as read
    if (!(mailbox == 'sent')){
      put_read(data);
    }
    console.log('This element has been clicked');
  });

  // Changes background to grey if the email is put as read
  if (data.read == true){
    email_element.style.background = 'rgb(188,188,188)';
  }

  // Adding the email ot the DOM
  document.querySelector('#emails-view').append(email_element);
}

function put_read(email){
  fetch(`/emails/${email.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
};

function set_archive(email){
  fetch(`/emails/${email.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archive: true
    })
  })

};