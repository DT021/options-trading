const Speech = {
    COMMANDS(){
      return{
        'hello travis': this.onGreeting.bind(this)
      }
    },
    init() {
        document.addEventListener('DOMContentLoaded', this.onLoad.bind(this));
    },
    onLoad() {
        console.log('onLoad');
        annyang.addCommands(this.COMMANDS());
        annyang.start();
    },
    setVoice() {

        var voices = window.speechSynthesis.getVoices();
    },
    speak(val){
      var msg = new SpeechSynthesisUtterance(val);
      window.speechSynthesis.speak(msg);
    },
    onGreeting() {
      console.log('here');
      this.speak('hello');
    }
};

Speech.init();
