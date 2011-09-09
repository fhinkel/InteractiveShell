
Ext.regController('ContactListController', {
    itemTap: function(dataObj) {  
        var views = dataObj.views,
          contactForm = views.contactForm,
          model = dataObj.model;
        
        contactForm.loadRecord(model);
    },
    deleteContact: function(dataObj) {
        var model = dataObj.model,
        modelStore = model.store;
        
        if (!model) {
            return;
        }  
        
        var confirmText = 'Do you want to remove ' + model.get('firstName') + ' ' + model.get('lastName') + '?';
        
        Ext.Msg.confirm(
            'Please confirm',
            confirmText,
            function (btn) {
                if (btn === 'yes') {
                    var newDispObj = Ext.applyIf({
                        controller: 'ContactFormPanelController',
                        action: 'newContact'
                    }, dataObj);
                    Ext.dispatch(newDispObj);
                    modelStore.remove(model);
                    modelStore.sync();  
                }
            }
        );
    }
});