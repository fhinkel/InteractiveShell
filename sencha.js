new Ext.Application({
    launch: function() {
		var onTestButtonTap = function(btn) {
			//alert("Test me!");
			// Ajax Post 
			Ext.Ajax.request({
			    url: 'test.php',
			    params: {
			        s: 'hello'
			    },
			    timeout: 3000,
			    method: 'POST',
			    success: function(xhr) {
					// render result from script in lesson ID
			        //alert('Response is "' + xhr.responseText + '"');
					//alert( Ext.getCmp('outputArea').value );
					var area = Ext.getCmp('outputArea');
					var oldContent = area.getValue();
					area.setValue(oldContent + xhr.responseText + " something new.\nsome extra lines \n \n \n ");
			    }
			});
		};
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
                text: 'Test',
                ui: 'button',
                handler: onTestButtonTap
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
                    html: '<h1>Lesson 1</h1><h4>Arithmetic</h4>' + 
	    		    'You can immediately do arithmetic with integers: <br>'+
	                '<code>34+222</code><br>'+
	    			   ' <code>107*431</code><br>'+
	    		    '<code>25!</code><br>'+
	    		    '<code>binomial(5,4)</code><br>'+
	    		    '<code>factor 32004</code><br>'
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
				id: 'areaContainer',
                layout: 'hbox',
                //style: 'border: 1px solid blue;',
				height: "100%",
                defaults: {
                    //style: "border: 1px solid red;",
                    height: "100%",
                    flex: 1
                },
                //html: 'This is our output area'
                xtype: 'container',
                items: [
                {
					id: "outputArea",
					style: "border: 1px solid yellow;",
                    xtype: "textareafield",
					renderTo: Ext.getCmp('areaContainer'),
					grow: true,
					height: "100%",
					width: "100%",				
					maxRows: "100%",
                    value: "This is a larger text area.\n\nWe can even get multiple lines in here\n",
					
                }
                ]

            }
            ]
        });
    }

});



