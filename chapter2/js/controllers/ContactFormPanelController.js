Ext.regController('ContactFormPanelController', {
   genNewModel: function() {
       return Ext.ModelMgr.create({
           id : new Date().format('U')
       }, 'ContactModel');
   },
   newContact : function(dataObj) {
       var views = dataObj.views,
         contactForm = views.contactForm,
         contactList = views.contactList,
         selectedMdl = contactList.getSelectedRecords()[0],
         newModel = this.genNewModel();
        
        contactForm.load(newModel);
        contactList.deselect(selectedMdl);
   },
   saveContact : function(dataObj) {
       var views = dataObj.views,
         contactForm = views.contactForm,
         contactList = views.contactList,
         contactListStore = contactList.store,
         currentRecord = contactForm.getRecord() || this.genNewModel(),
         idx;
        
        contactForm.updateRecord(currentRecord);
        idx = contactListStore.find('id', currentRecord.get('id'));
        if (idx == -1){
            contactListStore.add(currentRecord);
            contactListStore.sync();
            contactList.getSelectionModel().select(currentRecord);
        } else {
            currentRecord.commit();
        }
   }
});