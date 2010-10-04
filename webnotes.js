var jQT = $.jQTouch({
    icon: 'icon.png'
  });

var db;
var currId;

$(document).ready(function(){
    $('#addNote form').submit(addNote);
    $('#editNote form').submit(replaceNoteById);
    db = openDatabase('WebNotes', '1.0', 'WebNotes', 524288);
    db.transaction(
		   function(transaction) {
		     transaction.executeSql(
					    'CREATE TABLE IF NOT EXISTS notes ' +
					    ' (id INTEGER NOT NULL PRIMARY KEY ' +
					    '   AUTOINCREMENT, ' +
					    ' date DATE NOT NULL, title TEXT NOT NULL, ' +
					    ' note TEXT NOT NULL);');
		   }
		   );
    refreshNotes();
  });

function addNote() {
  var now = new Date();
  var title = $('#addNote .title').val();
  var note = $('#addNote .note').val();
  db.transaction(
		 function(transaction) {
		   transaction.executeSql(
					  'INSERT INTO notes (date, title, note) VALUES' +
					  ' (?,?,?)', [now, title, note],
					  function() {
					    $('#addNote .title').attr('value', "");
					    $('#addNote .note').text("");
					    refreshNotes();
					    jQT.goBack();
					  },
					  errorHandler);
		 });
  return false;
}

function errorHandler(transation, err) {
  alert('SQL err: ' + err.message + ' (' + err.code + ')');
  return true;
}

function refreshNotes() {
  $('#home ul li:gt(0)').remove();
  db.transaction(
		 function(transaction) {
		   transaction.executeSql(
					  'SELECT * from notes ORDER BY date;', 
					  null,
					  function(transaction, result){
					    for (var i=0; i<result.rows.length; i++){
					      var row = result.rows.item(i);
					      var newNote = $('#noteTemplate').clone();
					      newNote.removeAttr('id');
					      newNote.removeAttr('style');
					      newNote.data('noteId', row.id);
					      newNote.appendTo('#home ul');
					      newNote.find('.title').text(row.title);
					      newNote.click(function(){
						  editNoteById($(this).data('noteId'));
						  jQT.goTo('#editNote', 'swap');
						});
					    }
					  },
					  errorHandler);
		 });
}

function replaceNoteById() {
  db.transaction(
		 function(transaction) {
		   transaction.executeSql(
					  'UPDATE notes SET title=?, note=? WHERE id=?',
					  [$('#editNote .title').val(), 
					   $('#editNote .note').val(), 
					   currId],
					  function(transaction, result) {
					    refreshNotes();
					    jQT.goTo('#home', 'swap');
					  },
					  errorHandler);
		 });
}

function editNoteById(id) {
  db.transaction(
		 function(transaction) {
		   transaction.executeSql(
					  'SELECT * from notes WHERE id=?;',
					  [id], 
					  function(transaction, result) {
					    var res = result.rows.item(0);
					    currId = res.id;
					    $('#editNote .title').attr('value', res.title);
					    $('#editNote .note').text(res.note);
					  },
					  errorHandler);
		 });
}

function deleteNoteById() {
  db.transaction(
		 function(transaction) {
		   transaction.executeSql(
					  'DELETE FROM notes WHERE id=?;',
					  [currId], 
					  function(transaction, result) {
					    alert('Note deleted');
					    refreshNotes();
					    jQT.goBack();
					  },
					  errorHandler);
		 });
}
