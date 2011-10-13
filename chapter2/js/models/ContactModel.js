Ext.regModel('ContactModel', {
    proxy: {
        type: 'localstorage',
        id: 'contactModel'
    },
    fields: [
        'id',
        'firstName',
        'lastName',
        'street',
        'city',
        'state',
        'zip',
        'phone'
        ]
    });

Ext.regStore({
    model: 'ContactModel',
    storeId: 'ContactStore'
});
