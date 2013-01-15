$(document).ready(function(){
    //TODO: Move out as popup-ex1.js
    var popup1 = $("#button1").optionsPopup({
        id: "button1",
        title: "Hello World!",
        contents: [
            {"name": "About", url: "./index.html"},
            {"name": "Components", url: "./components.html"},
            {"name": "Link to second button's menu...", id: "button2"}
        ],
        disableHeader: true
    });
    //TODO: Fix popup so that misspelled object attr's throw errors.
    var popup2 = $("#button2").optionsPopup(
        {
            id:"button2",
            title: "Hello Again, World!",
            contents: [
                {"name": "Facebook", url: "http://www.facebook.com"},
                {"name": "Google", url: "http://www.google.com"},
                {"name": "Link to first button's menu...", id: "button1"}
            ],
            disableHeader: false
        }
    );

    $(document).on("popup.created", function () {
        $("#popupContentWrapper").jScrollPane({
            horizontalGutter: 0,
            verticalGutter: 0,
            'showArrows': false
        });
    });

    $(document).on('popup.setContent popup.updatePositions popup.visible popup.resize', function (e) {
        $("#popupContentWrapper").data('jsp').reinitialise();
    });

});