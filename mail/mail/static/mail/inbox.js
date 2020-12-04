document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');

  // for when the user submits a form on the compose email page.
  send_email();


});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#email-view').style.display = 'none';
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

  });
}

function show_email(data, mailbox){
  // Hides the email list and displays the single email
  document.getElementById('emails-view').style.display = 'none';
  document.getElementById('email-view').style.display = 'block';

  // Creates the div's needed to show the email
  var email_view = document.querySelector('#email-view');
  var email_head = document.createElement('div');
  var email_body = document.createElement('div'); 
  email_view.innerHTML = ""; 
  email_body.innerHTML = "<hr>";
  email_body.className = 'email-body';
  email_head.className = 'email-head';

  // Get title data different display depending on the mailbox
  email_body.innerHTML=`<p class="email-text"> ${data.body.replace(/\r?\n/g,'<br>')
        .replace(/^\s|\s(?=\s)/g, '&nbsp;')}</p>`;
  
  if (mailbox === 'inbox' || mailbox === 'archive'){
    email_head.innerHTML = `<p><b>From:</b>${data.sender}</p>`

    // Creates the archive button and its logic
    archive_btn = document.createElement('button');
    archive_btn.className = "btn btn-outline-secondary";

    archive_btn.addEventListener("click", function(){
      if (archive_btn.innerText == 'Archive'){        
        archive_btn.innerText = "Unarchive";
      }else{
        archive_btn.innerText = 'Archive';
      };
      toggle_archive(data);
    });

    // Creates the reply button and its logic
    reply_btn = document.createElement('button');
    reply_btn.className = "btn btn-secondary";  
    reply_btn.innerText = "Reply"      

    reply_btn.addEventListener("click", function(){
      console.log("Pressed reply");
      compose_reply(data);
    })

    if (data.archived === true){
      archive_btn.innerText = "Unarchive";
    }else{
      archive_btn.innerText = "Archive";
    }
    email_body.append(archive_btn, reply_btn);


  }else if(mailbox === 'sent'){
    email_head.innerHTML = `<p><b>To:</b> ${data.recipients.join(', ')}</p>`;
  }

  email_head.innerHTML = email_head.innerHTML + `
  <p><b>Subject:</b>${data.subject}</p>
  <p><b>Timestamp:</b>${data.timestamp}</p>
  <hr>`;

  // Displays the html items to the div
  email_view.append(email_head, email_body);

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
  };
  // Creates email
  var email_element = document.createElement('div');
  email_element.className = "email";
  email_element.innerHTML = `<h4 id="sender">${sender}:</h4> <p id="subject-line">${data.subject}</p> <p id="timestamp">${data.timestamp}</p>`;

  email_element.addEventListener('click', function() {
    // When button is clicked and not looking at sent box it will mark email as read
    if (!(mailbox == 'sent')){
      put_read(data);
    }
    show_email(data, mailbox);
  });
  // Changes background to grey if the email is put as read
  if (data.read == true){
    email_element.style.background = 'rgb(188,188,188)';
  };
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


function toggle_archive(email){
  
  // Makes it so that bool receives false when email.archive is true and vice versa
  var bool = !(email.archived === true);

  // Puts the result of bool away
  fetch(`/emails/${email.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: bool
    })
  })
  .then(response => {
    load_mailbox('inbox');
  })
};

function compose_reply(email){
  compose_email();
  subject_line = document.querySelector('#compose-subject');

  if (!(email.subject.substring(0,3) == "Re:")){
    subject_line.value = "Re: "
  }
  if (email.body === ""){
    document.querySelector('#compose-body').value = `----On ${email.timestamp} ${email.sender} wrote you an empty email.----`;
  }
  document.querySelector('#compose-body').value = `----On ${email.timestamp} ${email.sender} wrote---- \n\n` + email.body; 
  document.querySelector('#compose-recipients').value = email.sender;

  subject_line.value = subject_line.value + email.subject;
}