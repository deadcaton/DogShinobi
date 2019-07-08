'use strict';



const ajax = {
    Get(method) {
        let xhr = this.XHR();

        xhr.open('GET', method, false);
        xhr.send();

        if(xhr.status !== 200) {
            return xhr.onerror = function() {
                alert( 'Ошибка ' + this.status );
            }
        }
        else{
            return xhr.responseText;
        }
    },

    XHR() {
        return new XMLHttpRequest();
    }
};