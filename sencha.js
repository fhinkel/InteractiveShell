new Ext.Application({
    launch: function() {
        //alert ("Hello");
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
            alert("Hello".newIndex);

            myPanel.down("#cardPanel").setActiveItem(newIndex);
        };
        var ourDock = [{
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
        }];
        var myPanel = new Ext.Panel({
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
                dockedItems: ourDock,
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
            },
            {
                layout: 'hbox',
                style: 'border: 1px solid blue;',
                defaults: {
                    style: "border: 1px solid red;",
                    height: "100%",
                    flex: 1
                },
                items: [
                {
                    html: 'Panel (0, 0)'
                },
                {
                    html: 'Panel (1, 0)'
                },
                {
                    html: 'Panel (2, 0)'
                }
                ]
            },
            {
                layout: 'hbox',
                style: 'border: 1px solid blue;',
                defaults: {
                    style: "border: 1px solid red;",
                    height: "100%",
                    flex: 1,
                },
                items: [
                {
                    html: 'Panel (0, 1)'
                },
                {
                    html: 'Panel (1, 1)'
                },
                {
                    html: 'Panel (2, 1)'
                }
                ]
            }
            ]
        });
    }

});



