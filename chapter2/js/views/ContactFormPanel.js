
MyApp.ContactFormPanel = Ext.extend(Ext.form.FormPanel, {
    defaultType: 'textfield',
    scroll: 'vertical',
    defaults: { labelWidth: 65 },
    initComponent: function() {
        this.items = this.buildItems();
        MyApp.ContactFormPanel.superclass.initComponent.call(this);
    },
    buildItems: function() {
        return [
            {
                label: 'First',
                name: 'firstName'
            },
            {
                label: 'Last',
                name: 'lastName'
            },
            {
                label: 'street',
                name: 'street'
            },
            {
                label: 'City',
                name: 'City'
            },
            {
                label: 'State',
                name: 'state'
            },
            {
                label: 'Zip',
                name: 'zip'
            },
            {
                label: 'Phone',
                name: 'phone'
            },
        ]
    }
});

Ext.reg('ContactFormPanel', MyApp.ContactFormPanel);
