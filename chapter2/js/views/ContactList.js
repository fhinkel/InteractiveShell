
MyApp.ContactList = Ext.extend(Ext.List, {
    store: Ext.StoreMgr.get('ContactStore'),
    itemTpl: '{lastName}, {firstName}',
    emptyText: 'No contacts defined.',
    allowDeselect: false,
    onRender: function(){
        MyApp.ContactList.superclass.onrender.apply(this,arguments);
        this.store.load();
    }
});

Ext.reg('ContactList', MyApp.ContactList);
