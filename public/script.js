$(function() {
    var textareawidth = 0;
    if ($("#text-area").length > 0) {
        setInterval(function() {
            // Resize messages depending on the textarea
            var newwidth = $("#text-area").width();
            if (textareawidth != newwidth) {
                $(".message").css("width",
                    newwidth + 30);
                textareawidth = newwidth;
            }

            // Fix the bug with box-sizing + max-width
            var pagewidth = $(document).width();
            if (textareawidth >= pagewidth - 30) {
                $("#text-area").css("width",
                    pagewidth - 31)
            }
        }, 1000 / 15);
    }

    // drag and drop stuff
    $("#text-area").bind("dragenter", function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = "copy";
    }).bind("drop", function(e) {
        e.stopPropagation();
        var file = e.originalEvent.dataTransfer.files[0];
        console.log(file);
        e.preventDefault();
    });

    // submit button for the textarea
});
