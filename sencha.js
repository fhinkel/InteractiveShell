new Ext.Application({
    launch: function() {
        //alert ("Hello");
        var handleNavigation = function(btn) {

            var currentPanel = myPanel.down("#cardPanel").getActiveItem();
            var indexOfCurrentPanel = myPanel.down("#cardPanel").items.items.indexOf(currentPanel);
            var newIndex;

            if (btn.text == "Back") {
                newIndex = indexOfCurrentPanel > 0 ?
                indexOfCurrentPanel - 1:
                myPanel.down("#cardPanel").items.length - 1;
            }
            else {
                newIndex = indexOfCurrentPanel <
                myPanel.down("#cardPanel").items.length - 1 ?
                indexOfCurrentPanel + 1: 0;
            }
            //alert("Hello " + newIndex);

            myPanel.down("#cardPanel").setActiveItem(newIndex);
        };
        var ourDock = [{
            xtype: 'toolbar',
            dock: 'top',
            title: 'Macaulay2',
            items: [
            {
                text: 'Back',
                ui: 'back',
                handler: handleNavigation
            },

            {
                text: 'Next',
                ui: 'forward',
                handler: handleNavigation
            },
            {
                xtype: 'spacer'
            },
            {
                text: 'Help',
                ui: 'forward',
                handler: handleNavigation
            }
            ]
        }];
        var myPanel = new Ext.Panel({
            fullscreen: true,
            dockedItems: ourDock,
            layout: 'hbox',
            defaults: {
                height: '100%',
                flex: 1
            },
            items: [
 	           {
	                itemId: "cardPanel",
	                layout: 'card',
	                cardSwitchAnimation: 'slide',
	                items: [
	                {
	                    html: 'Lesson 1'
	                },
	                {
	                    html: 'Lesson 2'
	                },
	                {
	                    html: 'Lesson 3'
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
					html: 'This is our output area'
	            },
            ]
        });
    }

});



