MyApp.AppPanel = Ext.extend(Ext.Panel, {
    layout: 'fit',
    initComponent: function() {
        this.dockedItems = this.buildDockedItems();
        this.items = {
            xtype: 'ContactFormPanel'
        };
        MyApp.AppPanel.superclass.initComponent.call(this);
    },
    buildDockedItems: function() {
        return [
        this.buildTopDockToolbar(),
        this.buildLeftDockList(),
        this.buildBottomDockToolbar()
        ];
    },
    buildTopDockToolbar: function() {
        return {
            xtype: 'toolbar',
            dock: 'top',
            title: 'Contact Manager'
        };
    },
    buildLeftDockList: function() {
        return {
            xtype: 'panel',
            width: 220,
            dock: 'left',
            layout: 'fit',
            style: 'border-right: 1px solid;',
            items: [
            {
                xtype: 'ContactList',
                listeners: {
                    scope: this,
                    itemTap: this.onContactListItemTap,
                    itemSwipe: this.onContactListItemSwipe
                }
            }
            ],
            dockedItems: [
            {
                xtype: 'toolbar',
                dock: 'top',
                title: 'Contacts'
            }
            ]
        }
    },
    buildBottomDockToolbar: function() {
        return {
            xtype: 'toolbar',
            dock: 'bottom',
            defaults: {
                scope: this,
                handler: this.onBtnTap,
                controller: 'ContactFormPanelController'
            },
            items: [
            {
                text: 'New',
                action: 'newContact'
            },
            {
                text: 'Save',
                action: 'saveContact'
            },
            {
                xtype: 'spacer'
            },
            {
                text: 'Delete',
                action: 'deleteContact',
                controller: 'ContactListController'
            }
            ]
        }
    },
    onBtnTap: function(btn) {
        var contactForm = this.items.items[0],
        leftDock = this.getDockedItems()[1],
        model = contactForm.getRecord(),
        contactList = leftDock.items.items[0];
        alert("in button tap" + btn.action);
        if (btn.action === 'deleteContact' && !model) {
            return;
        }

        Ext.dispatch({
            controller: btn.controller,
            action: btn.action,
            model: model, 
            views: {
                contactForm: contactForm,
                contactList: contactList
            }
        });
    },
    onContactListItemTap: function(ctList, itemIdx) {
        this.dispatchToCtcLstCtrlr(ctList, itemIdx, 'itemTap');
        },
    onContactListItemSwipe: function(ctList, itemIdx) {
        this.dispatchToCtcLstCtrlr(ctList, itemIdx, 'deleteContact');
        },
    dispatchToCtcLstCtrlr: function(ctList, itemIdx, action) {
        var contactForm = this.items.items[0];
        
        Ext.dispatch({
            controller: 'ContactListController',
            action: action,
            model: ctList.store.getAt(itemIdx), 
            views: {
                contactForm: contactForm,
                contactList: ctList
            }
        });
        
        }

});