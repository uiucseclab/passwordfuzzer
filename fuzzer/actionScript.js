

	/* 	
		Code to execute when page reloads - i.e. when something is submitted, reload with a new password
		This js refreshes everytime the page reloads so it cannot store anything
		
		It has to send its input and form objects to the extension, then retrieve them
		to know where to inject the text.

		Implementation was problematic, commenting out.
	*/

/*
$(document).ready(function(){
	proactive();
});

function proactive(){
	chrome.runtime.sendMessage({ask: "ask"}, function(response) {
	  inp = response.inp;
	  form = response.form;
	  console.log(response.mess);
	  if(typeof inp != 'undefined'){
	  	inp = $(inp)
	  	form = $(form)
	  	//inp.val(response.mess)
	  	//console.log(inp)
	  	insert_submit(response.mess);
	  	//console.log('submitting', inp, form)
	  }})
}
*/


/* Global variables to ease the pain (global vars is a bad idea in general though) */

var inp;
var inp_store;
var form;
var form_store;

/*
 *	get_elems()
 *
 *	requests stored input and form info from the extension
 *	if null is returned, calls find_elems to define inp and form
 *	and sends to extension to store in persistent memory
 *				
 *	if extensions returns legitimate inp and form
 *	start fuzzing loop
*/

function get_elems(){
	chrome.runtime.sendMessage({ask: "ask"}, function(response) {
	  inp = response.inp;
	  form = response.form;

	  //console.log(response, inp, form)

	  if(typeof inp === 'undefined'){
	  	find_elems()
	  	console.log('sending')
	  	inp.val('sss')
	  	chrome.runtime.sendMessage({recv: "store", inp: inp_store, form: form_store})
	  }
	  else{
	  	inp = $(inp)
	  	form = $(form)
	  	insert_submit(response.mess);
	  	
	  	//console.log('submitting', inp, form)
	  }
	});
}

/*
 *	insert_submit(), text (string) = next password to try
 *				
 *	inserts text into input, submits form
 *
*/

function insert_submit(text){
	inp.val(text);

	console.log(text, inp, inp.val())

	//form.submit();
}

/*
 *	find_elems()
 *				
 *	retrieves the active element, sets to input
 *	gets parent of input which is a form, stores to form
*/

function find_elems(){
	inp = $(document.activeElement)
	inp_store = inp.clone().wrap('<p>').parent().html();

	inp.parents().each(function(){
		var cur = $(this);
		//console.log(cur.prop('tagName'))
		if(cur.prop('tagName')=="FORM"){
			form = cur;
			form_store = form.clone().wrap('<p>').parent().html();
		}
	});

}

/*
 *	Listener callback
 *				
 *	listens for messages from extension
 *	launches get_elems()
*/

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    get_elems()
  });