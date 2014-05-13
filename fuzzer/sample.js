/* Attaching events to buttons/actions in the extension popup */

$('#day').change(function(){
  save_bday();
});

$('#month').change(function(){
  save_bday();
});

$('#year').change(function(){
  save_bday();
});

$('#keywords').keyup(function(){
  save_keywords();
});


$('#relev').click(function(){
  search_keywords()
});

/*
$('#search').click(function(event){
  //search_keywords();

  pass_message('something')
})
*/

/* Generate a new set for fuzzing from date and keywords */

$('#create').click(function(event){
  delete localStorage['inp']
  delete localStorage['form']
  create_dict();
  
})


/* Load user settings when popup is opened */

$(window).load(function(){
  load_user_settings();
});

var mem_counter = 0;
var pass_count = 0;

/* retrieves next password from collection */
function get_next_pass(){
  var passes = localStorage['poswords'].split(',')
  return passes[mem_counter]
}

/* saves significant date information to persistent memory */
function save_bday(){
    var day = $('#day').val()
    var month = $('#month').val()
    var year = $('#year').val()

    localStorage['day'] = day;
    localStorage['month'] = month;
    localStorage['year'] = year;
}

/* cleans up and saves keywords to persistent memory */
function save_keywords(){
    var keywords = $('#keywords').val()

    keywords = keywords.split(' ')
    key_new = []

    for(var i = 0; i < keywords.length; i++){
      keywords[i] = keywords[i].trim()
      if(keywords[i]!=''){
       key_new.push(keywords[i]);
      }
    }

    //console.log('key_new', key_new);
    localStorage['keywords'] = key_new;
}

/* loads user settings to the popup page, setting all needed values */
function load_user_settings(){
      var keyword_list = localStorage['keywords'].split(',');
      //console.log('loading', keyword_list)

      var keyword_string = '';
      if(keyword_list.length == 1){
        keyword_string = keyword_list;
      }
      else{
        for(var i = 0; i < keyword_list.length; i++){
          keyword_string += keyword_list[i] + ' ';
        }
      }

      $('#day').val(localStorage['day']);
      $('#month').val(localStorage['month']);
      $('#year').val(localStorage['year']);
      $('#keywords').val(keyword_string);
}

/* sends message to content script */
function pass_message(mess){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {pass: mess})
  });
}

/* listens for messages from content script */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      console.log(request)
     if(request.recv == 'store'){
        localStorage['inp'] = request.inp;
        localStorage['form'] = request.form;
      }
    if(request.ask == 'ask'){

      sendResponse({inp: localStorage['inp'], form: localStorage['form'], mess: get_next_pass()});
    }
})

/* Assembles dictionary from all iterations of relevant words and significant date */
function create_dict(){

    var year = $('#year').val();
     var day = $('#day').val();
      var month = $('#month').val();

     // console.log(year, day, month)

   var relwords = localStorage['relwords'].split(',');
   //console.log(relwords);

   var big_list = []
    for(var i = 0; i < relwords.length; i++){
      pass = true;
      $('#status').html((i/relwords.length) + '%')
      //console.log(i/relwords.length)
      ret_list = word_iterations(relwords[i].toLowerCase(), year)
      big_list = big_list.concat(ret_list)
    }

    big_list.push(month.toLowerCase() + day + year);
    big_list.push(month.toLowerCase() + day + (year%100));

    console.log("All possible words", big_list)
    localStorage['words'] = big_list;
    
     $('#status').html('Done - '+big_list.length +' possible passwords. To see results, right click this window, choose inspect element and open up the Javascript console.')

    //word_iterations('soccer')

}

var diction = {"a": ['@'], "e":['3'], "i":['1'], "l":['7'], "o":['0'], "s":['$'], "A":['@'], "E":['3'], "I":['1'], "L":['7'], "O":['0'], "S":['$']};

/* Helps with replacing letter at index */
String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}


/* Assembles list of possible passwords */

function word_iterations(cur_word, year){

    var all_keys = keys(diction);
    var value = [];
    var ind = 0;
    var pos_replacements = {};
    var pos_words = []
    var empty = true;

    /*  
        Go through every entry in the dictionary and see if we can find it
        in the current word. Mark in pos_replacements that we can try 
        a replacement at this index.
    */
    for(var i = 0; i < all_keys.length; i++){
      value = diction[all_keys[i]];
      value = value.concat(all_keys[i]);

      ind = cur_word.indexOf(all_keys[i]);
      while(ind != -1){
        empty = false;
        pos_replacements[ind.toString()] = value
        ind = cur_word.indexOf(all_keys[i], ind+1);
      }
     }


     var lett = ''

     /*
        Go through every letter of word and add its upper case variant as a
        possible replacement.
     */
     for(var i = 0; i < cur_word.length; i++){
        
        lett = cur_word[i]

       // console.log(pos_replacements, lett)

        if(i in pos_replacements){
          pos_replacements[i] = pos_replacements[i].concat(lett.toUpperCase())
        }
        else{
         pos_replacements[i] = [lett.toUpperCase()] 
        }
     }

     //console.log(pos_replacements)

     if(empty)
      return;

     //console.log(cur_word, pos_replacements)

     /* 
        Pseudo recursive execution

        Go through all possible permutations of possible replacements.
        Example:
          if pos_replacements has marked index 1 for 2 possible replacements
          and index 4 for 3 possible replacements, it would look like this

          var pos_replacements = {1: ['a', 'A'], 4:['b', 'B', '6']}

          We create an array cur_state that keeps track of current index positions
          i.e.  for the above example if we're currently on the first replacement
                for index 1 and second for index 4, cur_state is [1,2]
          For every iteration, we increment the last index until it rolls over, which
          increments the one before it on and on until it rolls over the first index.
          
          Each iterations takes the original word and replaces the letters at the index
          with the possible letters from pos_replacements
     */
     var final_state = []
     var cur_state = []
      pos_keys = keys(pos_replacements);
     
      for(var i = 0; i < pos_keys.length; i++){
        var key = pos_keys[i]
        final_state.push(pos_replacements[key].length-1)
        cur_state.push([parseInt(key), 0])
      }
      
      var inc_index = 1;
      while(cur_state[0][1] <= final_state[0]){
        
        var new_word = cur_word;
        for(var i = 0; i < cur_state.length; i++){
                 //console.log(cur_state[i][0],pos_replacements[cur_state[i][0]][cur_state[i][1]])

          new_word = new_word.replaceAt(cur_state[i][0], pos_replacements[cur_state[i][0]][cur_state[i][1]])
        }

        pos_words.push(new_word);
        pos_words.push(new_word + (year%100));
        inc_index = 1
        while(inc_index > 0){
          var tmp = cur_state.length - inc_index;
          cur_state[tmp][1]++;
          if(cur_state[tmp][1] > final_state[tmp]){
            inc_index++
            if(inc_index > cur_state.length){
              inc_index = 0;
              break;
            }
            cur_state[tmp][1] = 0
          }
          else
            inc_index = 0;
        }

      }

      //console.log("assembled dictionary")
      return pos_words;

      
     
}

/* extracts keys from object */
function keys(obj)
{
    var keys = [];
    for(var key in obj)
    {
        if(obj.hasOwnProperty(key))
        {
            keys.push(key);
        }
    }
    return keys;
}

/*
    retrieves all relevant words from keywords
    Queries wordassociations.net, gets top 10 results
*/
function search_keywords(){
  $('#status').html('Getting relevant words')
  
       var terms = localStorage['keywords'].split(',');
       localStorage['relwords'] = terms;

       for(var i = 0; i < terms.length; i++){
       
        $.ajax({
          type: "GET", 
          url: "http://wordassociations.net/search?hl=en&q=" + terms[i],
          dataType: "html", 
          success: function(html, status){

            //console.log(html)
            var reg = new RegExp("w=([A-Z][a-z]+)\"", "g")

            var matches = ' ';
            var relwords = []

            matches = reg.exec(html);
            var count = 0;
            while (matches != null) {    
                relwords.push(matches[1]);
                matches = reg.exec(html);
                count++
                if(count > 10)
                  break;
            }


            localStorage['relwords'] = localStorage['relwords'].split(',').concat(relwords);
            var len = localStorage['relwords'].split(',').length

            $('#status').html('Retrieved ' + len + ' relevant words')

          }
        })
       }
}

