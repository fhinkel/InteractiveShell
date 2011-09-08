new Ext.Application({
    launch: function() {
        var mainPanel = new Ext.Panel({
            fullscreen: true,
            layout: 'vbox',
            defaults: {
                width: '100%',
                flex: 1
            },
            items: [
            {
                itemId: "cardPanel",
                layout: 'card',
                cardSwitchAnimation: 'slide',
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'top',
                    title: 'Nested Layout',
                    items: [
                    {
                        text: 'Back',
                        ui: 'back',
                        handler: handleNavigation
                    },
                    {
                        xtype: 'spacer'
                    },
                    {
                        text: 'Next',
                        ui: 'forward',
                        handler: handleNavigation
                    }
                    ]
                }],
                items: [
                {
                    html: 'Card 1'
                },
                {
                    html: 'Card 2'
                },
                {
                    html: 'Card 3'
                }
                ]
            }
            ]
        });
    }


});


var handleNavigation = function(btn) {
    var currentPanel = myPanel.down("#cardPanel").getActiveItem();
    var indexOfCurrentPanel = myPanel.down("#cardPanel").items.items.indexOf(currentPanel);
    var newIndex;

    if (btn.text == "Back") {
        var newIndex = indexOfCurrentPanel > 0 ?
				        indexOfCurrentPanel - 1:
				        myPanel.down("#cardPanel").items.length - 1;
    }
    else {
        var newIndex = indexOfCurrentPanel < 
						myPanel.down("#cardPanel").items.length - 1 ?
				        indexOfCurrentPanel + 1: 0;
    }
    myPanel.down("#cardPanel").setActiveItem(newIndex);
}

