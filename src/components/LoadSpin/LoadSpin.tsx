import style from "./LoadSpin.module.css"

const LoadSpin = ({ Load, one }: { Load: boolean, one?: boolean}) => {

    setTimeout(() => {
        const load = document.getElementById('Loadspin')
        if (load) {
            load.classList.add(style.LoadSpinFull);
        }
    }, 300);
    return (
        Load &&
        <>
            {one ?
                <div className={style.LoadSpin}></div>
                : (
                    <>
                        <div id="Loadspin" className={style.LoadSpinConteiner}>
                            <div className={[style.LoadSpin, one && style.LoadSpins].join('')}></div>
                        </div>
                        <div className={style.LoadBack} />
                    </>
                )}
        </>

    );
}

export default LoadSpin;