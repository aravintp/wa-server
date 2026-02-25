
        let date = new Date()
        let d = date.toLocaleDateString().replaceAll("/","-") + 
        " " + date.toTimeString().split(' ')[0]

        console.log(d)