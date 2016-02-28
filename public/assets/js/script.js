function initNavbar() {

    var scrollSpeed = 650;
    var scrollOffset = 50;
    var easing = 'swing';

    $('#navbar-top .navbar-default ul.nav').onePageNav({
        currentClass: 'active',
        changeHash: true,
        scrollSpeed: scrollSpeed,
        scrollOffset: scrollOffset,
        scrollThreshold: 0.25,
        filter: ':not(.external)',
        easing: easing,
		begin: function() {
			$('.navbar-collapse').collapse('hide');
		},
		scrollChange: function($li) {
			var label = $('a', $li).text();
			_gaq.push(['_trackEvent', label, 'viewed']);
		}
    });

    $('.nav-external').click(function (e) {
        e.preventDefault();
        $('html, body').stop().animate({
            scrollTop: $($(this).attr("href")).offset().top - scrollOffset
        }, scrollSpeed, easing);
    });

    $('#navbar-top .navbar-default').affix({
        offset: {
            top: $('#home').height()
        }
    });

};

function initPortfolio () {
    var portfolio = $('#portfolio');
    var items = $('.items', portfolio);
    var filters = $('.filters li a', portfolio);

	$('a', portfolio).click(function( e ) {
		e.preventDefault();
		return false;
	});

    items.imagesLoaded(function() {
        items.isotope({
            itemSelector: '.item',
            layoutMode: 'fitRows',
            transitionDuration: '0.7s'
        });
    });

    filters.click(function(){
        var el = $(this);
        filters.removeClass('active');
        el.addClass('active');
        var selector = el.attr('data-filter');
        items.isotope({ filter: selector });
        return false;
    });
};

function initAnimations() {
    $('.animated').appear(function () {
        var el = $(this);
        var animation = el.data('animation');
        var delay = el.data('delay');
        if (delay) {
            setTimeout(function () {
                el.addClass(animation);
                el.addClass('showing');
                el.removeClass('hiding');
            }, delay);
        } else {
            el.addClass(animation);
            el.addClass('showing');
            el.removeClass('hiding');
        }
    }, {
        accY: -60
    });

	$('.carousel').carousel({
		interval: 10000
    });

    // Service hover animation
	$('.service').hover(function(){
		$('i', this).addClass('animated tada');
	},function(){
        $('i', this).removeClass('animated tada');
	});
};

function resetForm(form) {
	setTimeout(function(){
		$('button.btn', form).text('Message Sent...');
		$(':input', form).attr('disabled', true);
		var fheight = $('form.contact').height();
		var rheight = $('form.contact .form-group:last-child').height();
		$('form.contact').css('min-height', fheight);
		$('form.contact .success').css('min-height', fheight - rheight);
		$('form.contact').parent().parent().siblings('.heading').hide();
		$('form.contact .form-group').fadeOut(function() {
			$('form.contact .success').fadeIn();
			$('form.contact .form-group:last-child').fadeIn();
		});
	},1000)
};

$(document).ready(function () {
    initNavbar();
    initPortfolio();
    initAnimations();

	var validator = $('form.contact').validate({
		errorPlacement: function(error, element) {
			
		},
		submitHandler: function(form) {
			$(':input', form).attr('readonly', true);
			$('button.btn', form).button('loading');
			$(form).ajaxSubmit({
				type: "POST",
				url: "/send-message",
				success: function(response) {
					resetForm(form);
				},
				error: function(xhr) {
					var errors = xhr.responseJSON;
					validator.showErrors(errors);
				}
			});
			return false;
		}
	});


	$(window).on('hashchange', function() {
		var label = $('#navbar-top .navbar-default ul.nav a[href="'+location.hash+'"]').text();
		_gaq.push(['_trackEvent', label, 'viewed']);
	});
});

$(window).load(function () {
    $(".loader .fading-line").fadeOut();
    $(".loader").fadeOut("slow");
});
